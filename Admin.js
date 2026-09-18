// ------------------------------------------
// 1. GLOBAL DATA & INITIALIZATION
// ------------------------------------------
let menuItems = [];
let orders = [];
let dashboardOrderFilter = "all";

// ==========================================
// ADMIN PUSH NOTIFICATIONS
// ==========================================

let adminMessaging = null;

// Firebase Console ನಲ್ಲಿ Generate ಮಾಡಿದ
// Web Push public VAPID key ಇಲ್ಲಿ ಹಾಕಬೇಕು
const ADMIN_VAPID_KEY =
    "BFLHCCqqLUmJJGp2jX8llp-G8ljiApNJLRMbENCOQfbul_v1kdvpIRc4-sgQKjfisW3XCSm4EluulrGKMbzHoLk";

async function setupAdminPushNotifications() {

    try {

        // Browser notification support
        if (!("Notification" in window)) {
            console.warn("⚠️ Browser notifications not supported.");
            return;
        }

        // Service Worker support
        if (!("serviceWorker" in navigator)) {
            console.warn("⚠️ Service Worker not supported.");
            return;
        }

        // Ask permission
        if (Notification.permission === "default") {
            const permission =
                await Notification.requestPermission();

            if (permission !== "granted") {
                console.warn("⚠️ Notification permission not granted.");
                return;
            }
        }

        if (Notification.permission !== "granted") {
            return;
        }

        // Firebase Messaging
        if (!firebase.messaging) {
            console.error(
                "❌ Firebase Messaging SDK not loaded."
            );
            return;
        }

        // Register Service Worker
        const registration =
            await navigator.serviceWorker.register(
                "firebase-messaging-sw.js"
            );

        console.log(
            "✅ Firebase Messaging Service Worker registered."
        );

        // Create messaging instance
        adminMessaging = firebase.messaging();

        // Get FCM registration token
        const token =
            await adminMessaging.getToken({
                vapidKey: ADMIN_VAPID_KEY,
                serviceWorkerRegistration: registration
            });

        if (!token) {
            console.warn(
                "⚠️ FCM token not available."
            );
            return;
        }

        console.log(
            "✅ Admin FCM Token:",
            token
        );

        // Save admin device token
        await database
            .ref("pistaHouse/adminNotificationToken")
            .set({
                token: token,
                updatedAt: new Date().toISOString()
            });

        console.log(
            "✅ Admin notification token saved."
        );

        // Foreground notification
        adminMessaging.onMessage(function(payload) {

            console.log(
                "🔔 New FCM message:",
                payload
            );

            const title =
                payload.notification?.title ||
                "Pista House Ballari";

            const body =
                payload.notification?.body ||
                "New order received!";

            showToast(
                "🔔 " + body
            );

            // Browser notification while page is open
            if (
                Notification.permission === "granted"
            ) {

                try {

                    new Notification(
                        title,
                        {
                            body: body,
                            icon: "logo.png",
                            tag: "pista-house-new-order"
                        }
                    );

                } catch (error) {

                    console.error(
                        "❌ Foreground notification error:",
                        error
                    );

                }

            }

        });

    } catch (error) {

        console.error(
            "❌ Admin Push Notification Setup Error:",
            error
        );

    }

}

// ==========================================
// FIREBASE MENU SYNC
// ==========================================
async function loadMenuFromFirebase() {

    try {

        const snapshot = await database
            .ref("pistaHouse/menuItems")
            .once("value");

        const firebaseMenu = snapshot.val();

        if (firebaseMenu && typeof firebaseMenu === "object") {

            // Firebase object -> array
            menuItems = Object.values(firebaseMenu);

            // Remove invalid duplicate items
            const uniqueItems = [];
            const seenIds = new Set();

            menuItems.forEach(function(item) {

                if (!item || !item.id) return;

                const id = String(item.id);

                if (!seenIds.has(id)) {
                    seenIds.add(id);
                    uniqueItems.push(item);
                }

            });

            menuItems = uniqueItems;

            localStorage.setItem(
                "menuItems",
                JSON.stringify(menuItems)
            );

            console.log(
                "✅ Firebase Menu Loaded:",
                menuItems.length
            );

            displayMenu();
            return;
        }

        // Firebase empty → localStorage fallback
        const localMenu =
            localStorage.getItem("menuItems");

        if (localMenu) {

            try {

                const parsedMenu =
                    JSON.parse(localMenu);

                if (Array.isArray(parsedMenu)) {

                    menuItems = parsedMenu;

                    await saveMenuToFirebase();

                    console.log(
                        "✅ Local menu migrated to Firebase"
                    );
                }

            } catch (error) {

                console.error(
                    "❌ Local menu parse error:",
                    error
                );

            }

        }

    } catch (error) {

        console.error(
            "❌ Firebase Menu Load Error:",
            error
        );

        // LocalStorage fallback
        try {

            const localMenu =
                localStorage.getItem("menuItems");

            menuItems =
                localMenu
                    ? JSON.parse(localMenu)
                    : [];

            displayMenu();

        } catch (e) {

            menuItems = [];

        }

    }

}





async function loadOrdersFromFirebase() {
    try {
        const snapshot = await database.ref("pistaHouse/orders").once("value");
        const firebaseOrders = snapshot.val();
        orders = (firebaseOrders && typeof firebaseOrders === "object")
            ? Object.values(firebaseOrders)
            : [];
        localStorage.setItem("orders", JSON.stringify(orders));
        console.log("✅ Firebase Orders Loaded:", orders.length);
    } catch (error) {
        console.error("❌ Firebase Orders Load Error:", error);
    }
}

let adminOrdersInitialized = false;
let knownAdminOrderIds = new Set();


function createAdminNotificationUI() {

    // Already created
    if (
        document.getElementById(
            "adminNotificationButton"
        )
    ) {
        return;
    }

    const button =
        document.createElement("button");

    button.id =
        "adminNotificationButton";

    button.innerHTML =
        "🔔 Notifications";

    button.style.cssText = `
        position:fixed;
        top:15px;
        right:15px;
        z-index:99999;
        border:none;
        border-radius:12px;
        padding:12px 16px;
        background:#16a34a;
        color:white;
        font-size:14px;
        font-weight:bold;
        cursor:pointer;
        box-shadow:0 4px 15px rgba(0,0,0,.20);
    `;

    button.onclick =
        async function() {

            if (
                !("Notification" in window)
            ) {
                alert(
                    "This browser does not support notifications."
                );
                return;
            }

            try {

                const permission =
                    await Notification.requestPermission();

                if (
                    permission === "granted"
                ) {

                    showToast(
                        "🔔 Notifications enabled!"
                    );

                } else {

                    alert(
                        "Notification permission not granted."
                    );

                }

            } catch (error) {

                console.error(
                    "Notification permission error:",
                    error
                );

            }

        };

    document.body.appendChild(button);
}


function showNewOrderNotification(order) {

    const customer =
        order.customerName ||
        order.name ||
        "Customer";

    const table =
        order.tableNumber ||
        order.table ||
        "-";

    const total =
        Number(order.total || 0)
            .toLocaleString("en-IN");

    const message =
        `🛎️ New order from ${customer} | Table ${table} | ₹${total}`;


    // In-page toast
    showToast(
        message
    );


    // Browser notification
    try {

        if (
            "Notification" in window &&
            Notification.permission === "granted"
        ) {

            const notification =
                new Notification(
                    "🛎️ New Order - Pista House",
                    {
                        body:
                            `Customer: ${customer}\n` +
                            `Table: ${table}\n` +
                            `Total: ₹${total}`,

                        icon: "logo.png",

                        tag:
                            "pista-house-new-order-" +
                            String(order.id),

                        renotify: true
                    }
                );

            notification.onclick =
                function() {

                    window.focus();

                    notification.close();

                    showSection(
                        "orders"
                    );

                };

        }

    } catch (error) {

        console.error(
            "❌ Browser notification error:",
            error
        );

    }


    // Sound
    try {

        const audio =
            new Audio();

        audio.src =
            "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

        audio.play()
            .catch(
                () => {}
            );

    } catch (error) {}

}


function listenForOrderUpdates() {

    createAdminNotificationUI();


    database
        .ref("pistaHouse/orders")
        .on(
            "value",
            function(snapshot) {

                const firebaseOrders =
                    snapshot.val();


                const newOrders =
                    (
                        firebaseOrders &&
                        typeof firebaseOrders ===
                        "object"
                    )
                        ? Object.values(
                            firebaseOrders
                        )
                        : [];


                // Find NEW orders
                if (
                    adminOrdersInitialized
                ) {

                    newOrders.forEach(
                        function(order) {

                            if (!order || !order.id) {
                                return;
                            }

                            const orderId =
                                String(
                                    order.id
                                );

                            if (
                                !knownAdminOrderIds
                                    .has(orderId)
                            ) {

                                showNewOrderNotification(
                                    order
                                );

                            }

                        }
                    );

                }


                // Update known IDs
                knownAdminOrderIds =
                    new Set(
                        newOrders
                            .filter(
                                order =>
                                    order &&
                                    order.id
                            )
                            .map(
                                order =>
                                    String(
                                        order.id
                                    )
                            )
                    );


                // First Firebase load
                if (
                    !adminOrdersInitialized
                ) {

                    adminOrdersInitialized =
                        true;

                }


                // Update global orders
                orders =
                    newOrders;


                localStorage.setItem(
                    "orders",
                    JSON.stringify(
                        orders
                    )
                );


                displayOrders();

                updateDashboard();

            },
            function(error) {

                console.error(
                    "❌ Firebase Orders Listener Error:",
                    error
                );

            }
        );

}


// ------------------------------------------
// 2. PAGE NAVIGATION
// ------------------------------------------
function showSection(sectionId, keepOrderFilter = false) {

    const sections =
        document.querySelectorAll(".section");

    sections.forEach(section => {
        section.classList.remove("active");
    });

    const selectedSection =
        document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.add("active");
    }

    const navButtons =
        document.querySelectorAll(".nav");

    navButtons.forEach(button => {
        button.classList.remove("active");
    });

    navButtons.forEach(button => {

        const text =
            button.innerText.toLowerCase();

        if (
            (sectionId === "dashboard" &&
                text.includes("dashboard")) ||

            (sectionId === "restaurant" &&
                text.includes("restaurant")) ||

            (sectionId === "menu" &&
                text.includes("menu")) ||

            (sectionId === "orders" &&
                text.includes("orders")) ||

            (sectionId === "tables" &&
                text.includes("tables")) ||

            (sectionId === "analytics" &&
                text.includes("sales analytics"))
        ) {
            button.classList.add("active");
        }

    });

    // Normal Orders button = show all orders
    if (
        sectionId === "orders" &&
        !keepOrderFilter
    ) {
        dashboardOrderFilter = "all";
    }

    if (sectionId === "dashboard") {
        updateDashboard();
    }

    if (sectionId === "menu") {
        displayMenu();
    }

    if (sectionId === "orders") {
        displayOrders();
    }

    if (sectionId === "tables") {
        displayTables();
    }

    if (sectionId === "analytics") {
        displaySalesAnalytics();
    }

}

// ------------------------------------------
// 3. RESTAURANT DETAILS (SAVE & LOAD)
// ------------------------------------------
function saveRestaurant() {
    const restaurant = {
        name: document.getElementById("restaurantName").value.trim(),
        phone: document.getElementById("restaurantPhone").value.trim(),
        address: document.getElementById("restaurantAddress").value.trim(),
        instagram: document.getElementById("restaurantInstagram").value.trim(),
        openingTime: document.getElementById("openingTime").value,
        closingTime: document.getElementById("closingTime").value,
        preparationTime: document.getElementById("preparationTime").value,
        priceRange: document.getElementById("priceRange").value.trim(),
        description: document.getElementById("restaurantDescription").value.trim()
    };

    localStorage.setItem("restaurantDetails", JSON.stringify(restaurant));
    alert("Restaurant details saved successfully! ✅");
}

function loadRestaurant() {
    const saved = localStorage.getItem("restaurantDetails");
    if (!saved) return;

    const restaurant = JSON.parse(saved);
    if (document.getElementById("restaurantName")) {
        document.getElementById("restaurantName").value = restaurant.name || "Pista House Ballari";
        document.getElementById("restaurantPhone").value = restaurant.phone || "+91 99662 28888";
        document.getElementById("restaurantAddress").value = restaurant.address || "";
        document.getElementById("restaurantInstagram").value = restaurant.instagram || "";
        document.getElementById("openingTime").value = restaurant.openingTime || "06:00";
        document.getElementById("closingTime").value = restaurant.closingTime || "23:00";
        document.getElementById("preparationTime").value = restaurant.preparationTime || "25";
        document.getElementById("priceRange").value = restaurant.priceRange || "";
        document.getElementById("restaurantDescription").value = restaurant.description || "";
    }
}

// ------------------------------------------
// 4. DASHBOARD & LOGOUT
// ------------------------------------------
function updateDashboard() {

    const now = new Date();

    // TODAY ORDERS ONLY
    const todayOrders = orders.filter(function(order) {

        if (!order.createdAt) return false;

        const orderDate = new Date(order.createdAt);

        return (
            orderDate.getFullYear() === now.getFullYear() &&
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getDate() === now.getDate()
        );

    });


    // TODAY STATUS COUNTS
    const totalOrders = todayOrders.length;

    const pendingOrders = todayOrders.filter(function(order) {
        return (
            order.status === "Pending" ||
            order.status === "Received"
        );
    }).length;

    const preparingOrders = todayOrders.filter(function(order) {
        return order.status === "Preparing";
    }).length;


    // TODAY SALES
    const sales = todayOrders.reduce(function(total, order) {
        return total + Number(order.total || 0);
    }, 0);


    // UPDATE DASHBOARD CARDS
    const totalElement =
        document.getElementById("totalOrders");

    const pendingElement =
        document.getElementById("pendingOrders");

    const preparingElement =
        document.getElementById("preparingOrders");

    const salesElement =
        document.getElementById("salesAmount");


    if (totalElement) {
        totalElement.innerText = totalOrders;
    }

    if (pendingElement) {
        pendingElement.innerText = pendingOrders;
    }

    if (preparingElement) {
        preparingElement.innerText = preparingOrders;
    }

    if (salesElement) {
        salesElement.innerText =
            "₹" + sales.toLocaleString("en-IN");
    }

}


// DASHBOARD CARD CLICK
function openDashboardOrders(filter) {

    dashboardOrderFilter = filter;

    showSection("orders", true);

}


// Refresh dashboard every minute
setInterval(function() {
    updateDashboard();
}, 60000);
// ------------------------------------------
// SALES ANALYTICS
// ------------------------------------------

function showAnalyticsPeriod(period) {

    const buttons =
        document.querySelectorAll(".analytics-btn");

    buttons.forEach(button => {
        button.classList.remove("active");
    });

    if (event && event.target) {
        event.target.classList.add("active");
    }


    const monthSelector =
        document.getElementById("monthSelector");

    const yearSelector =
        document.getElementById("yearSelector");


    // MONTH
    if (period === "month") {

        if (monthSelector) {
            monthSelector.classList.remove("hidden");
        }

        if (yearSelector) {
            yearSelector.classList.add("hidden");
        }

        const month =
            document.getElementById("analyticsMonth");

        if (month) {
            month.value =
                new Date().getMonth();
        }

        showSelectedMonth();

        return;
    }


    // YEAR
    if (period === "year") {

        if (monthSelector) {
            monthSelector.classList.add("hidden");
        }

        if (yearSelector) {
            yearSelector.classList.remove("hidden");
        }

        const yearSelect =
            document.getElementById("analyticsYear");

        if (yearSelect) {

            const currentYear =
                new Date().getFullYear();

            yearSelect.innerHTML = "";

            for (
                let year = currentYear;
                year >= currentYear - 5;
                year--
            ) {

                const option =
                    document.createElement("option");

                option.value = year;
                option.textContent = year;

                yearSelect.appendChild(option);
            }

            yearSelect.value = currentYear;
        }

        showSelectedYear();

        return;
    }


    // OTHER PERIODS

    if (monthSelector) {
        monthSelector.classList.add("hidden");
    }

    if (yearSelector) {
        yearSelector.classList.add("hidden");
    }

    displayAnalyticsData(period);
}


function showSelectedMonth() {

    const monthElement =
        document.getElementById("analyticsMonth");

    if (!monthElement) return;

    const month =
        Number(monthElement.value);

    displayAnalyticsData("month", month);
}

function showSelectedYear() {

    const yearElement =
        document.getElementById("analyticsYear");

    if (!yearElement) return;

    const year =
        Number(yearElement.value);

    displayAnalyticsData("year", null, year);
}

function displaySalesAnalytics() {

    displayAnalyticsData("today");

}


function displayAnalyticsData(
    period,
    selectedMonth = null,
    selectedYear = null
) {

    const result =
        document.getElementById("analyticsResult");

    if (!result) return;


    const now = new Date();

    let filteredOrders = [];


    // TODAY
    if (period === "today") {

        filteredOrders =
            orders.filter(order => {

                if (!order.createdAt) return false;

                const date =
                    new Date(order.createdAt);

                return (
                    date.getFullYear() === now.getFullYear() &&
                    date.getMonth() === now.getMonth() &&
                    date.getDate() === now.getDate()
                );

            });

    }


    // YESTERDAY
    else if (period === "yesterday") {

        const yesterday =
            new Date(now);

        yesterday.setDate(
            yesterday.getDate() - 1
        );

        filteredOrders =
            orders.filter(order => {

                if (!order.createdAt) return false;

                const date =
                    new Date(order.createdAt);

                return (
                    date.getFullYear() === yesterday.getFullYear() &&
                    date.getMonth() === yesterday.getMonth() &&
                    date.getDate() === yesterday.getDate()
                );

            });

    }


    // LAST 7 DAYS
    else if (period === "week") {

        const startDate =
            new Date(now);

        startDate.setDate(
            startDate.getDate() - 6
        );

        startDate.setHours(0, 0, 0, 0);

        filteredOrders =
            orders.filter(order => {

                if (!order.createdAt) return false;

                const date =
                    new Date(order.createdAt);

                return date >= startDate &&
                       date <= now;

            });

    }


    // MONTH
    else if (period === "month") {

        const month =
            selectedMonth !== null
                ? selectedMonth
                : now.getMonth();

        filteredOrders =
            orders.filter(order => {

                if (!order.createdAt) return false;

                const date =
                    new Date(order.createdAt);

                return (
                    date.getFullYear() === now.getFullYear() &&
                    date.getMonth() === month
                );

            });

    }


    // YEAR
    else if (period === "year") {

    const year =
        selectedYear !== null
            ? selectedYear
            : now.getFullYear();

    filteredOrders =
        orders.filter(order => {

            if (!order.createdAt) return false;

            const date =
                new Date(order.createdAt);

            return (
                date.getFullYear() === year
            );

        });

}


    // ------------------------------------------
    // CALCULATE SALES
    // ------------------------------------------

    const totalOrders =
        filteredOrders.length;


    let totalItems = 0;

    let totalSales = 0;

    const foodSales = {};


    filteredOrders.forEach(order => {

        totalSales +=
            Number(order.total || 0);


        if (
            Array.isArray(order.items)
        ) {

            order.items.forEach(item => {

                const name =
                    item.name || "Unknown Food";

                const quantity =
                    Number(item.quantity || 1);

                const price =
                    Number(item.price || 0);


                totalItems += quantity;


                if (!foodSales[name]) {

                    foodSales[name] = {
                        quantity: 0,
                        amount: 0
                    };

                }


                foodSales[name].quantity +=
                    quantity;

                foodSales[name].amount +=
                    price * quantity;

            });

        }

    });


    // ------------------------------------------
    // SORT FOOD BY MOST SOLD
    // ------------------------------------------

    const sortedFoods =
        Object.entries(foodSales)
        .sort(
            (a, b) =>
                b[1].quantity - a[1].quantity
        );


    const bestSeller =
        sortedFoods.length > 0
            ? sortedFoods[0][0]
            : "No sales";


    // ------------------------------------------
    // PERIOD TITLE
    // ------------------------------------------

    let periodTitle = "Today";


    if (period === "yesterday") {
        periodTitle = "Yesterday";
    }


    if (period === "week") {
        periodTitle = "Last 7 Days";
    }


    if (period === "year") {
        periodTitle =
            "Year " + now.getFullYear();
    }


    if (period === "month") {

        const month =
            selectedMonth !== null
                ? selectedMonth
                : now.getMonth();

        const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];

        periodTitle =
            monthNames[month] +
            " " +
            now.getFullYear();

    }


    // ------------------------------------------
    // FOOD LIST HTML
    // ------------------------------------------

    let foodHTML = "";


    if (sortedFoods.length === 0) {

        foodHTML = `
            <div class="card">
                <h3>🍽️ No Food Sales</h3>
                <p>
                    No orders found for
                    ${periodTitle}.
                </p>
            </div>
        `;

    } else {

        foodHTML =
            sortedFoods
            .map(function(entry) {

                const name = entry[0];

                const data = entry[1];

                return `
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:10px;
                        padding:12px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">

                        <div>
                            <strong>
                                🍽️ ${escapeHTML(name)}
                            </strong>

                            <div style="
                                color:#6b7280;
                                font-size:13px;
                                margin-top:4px;
                            ">
                                ${data.quantity} sold
                            </div>
                        </div>

                        <strong>
                            ₹${data.amount.toLocaleString("en-IN")}
                        </strong>

                    </div>
                `;

            })
            .join("");

    }


    // ------------------------------------------
    // DISPLAY RESULT
    // ------------------------------------------

    result.innerHTML = `

        <div class="card">

            <h2>
                📊 ${periodTitle} Sales
            </h2>


            <div style="
                display:grid;
                grid-template-columns:
                    repeat(2, 1fr);
                gap:12px;
                margin-top:18px;
            ">

                <div style="
                    padding:15px;
                    background:#f8fafc;
                    border-radius:12px;
                ">
                    📦
                    <strong>
                        ${totalOrders}
                    </strong>

                    <div>
                        Orders
                    </div>
                </div>


                <div style="
                    padding:15px;
                    background:#f8fafc;
                    border-radius:12px;
                ">
                    🍽️
                    <strong>
                        ${totalItems}
                    </strong>

                    <div>
                        Food Items Sold
                    </div>
                </div>


                <div style="
                    padding:15px;
                    background:#f8fafc;
                    border-radius:12px;
                ">
                    💰
                    <strong>
                        ₹${totalSales.toLocaleString("en-IN")}
                    </strong>

                    <div>
                        Total Sales
                    </div>
                </div>


                <div style="
                    padding:15px;
                    background:#f8fafc;
                    border-radius:12px;
                ">
                    🏆
                    <strong>
                        ${escapeHTML(bestSeller)}
                    </strong>

                    <div>
                        Highest Selling
                    </div>
                </div>

            </div>

        </div>


        <div class="card">

            <h2>
                🍽️ Food Sales
            </h2>

            <p style="color:#6b7280;">
                ${periodTitle} 
              sells
            </p>

            <div>
                ${foodHTML}
            </div>

        </div>

    `;

}


function logout() {
    const confirmLogout = confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;
    window.location.href = "index.html";
}

let editingFoodId = null;

function openFoodForm() {
    const form = document.getElementById("foodForm");
    if (!form) return;
    form.classList.remove("hidden");
    editingFoodId = null;
    document.getElementById("formTitle").innerText = "Add Menu Item";
    clearFoodForm();
}

function closeFoodForm() {
    const form = document.getElementById("foodForm");
    if (!form) return;
    form.classList.add("hidden");
    editingFoodId = null;
    clearFoodForm();
}

function clearFoodForm() {
    if (document.getElementById("foodName")) document.getElementById("foodName").value = "";
    if (document.getElementById("foodPrice")) document.getElementById("foodPrice").value = "";
    if (document.getElementById("foodCategory")) document.getElementById("foodCategory").value = "Starters";
    if (document.getElementById("foodTime")) document.getElementById("foodTime").value = "20";
    if (document.getElementById("foodImage")) document.getElementById("foodImage").value = "";
    if (document.getElementById("foodDescription")) document.getElementById("foodDescription").value = "";
}

async function saveMenuItemToFirebase(item) {

    if (!item || !item.id) {
        throw new Error("Invalid menu item");
    }

    await database
        .ref("pistaHouse/menuItems/" + item.id)
        .set(item);

    localStorage.setItem(
        "menuItems",
        JSON.stringify(menuItems)
    );

    console.log(
        "✅ Menu item saved:",
        item.name
    );
}


async function updateMenuItemToFirebase(item) {

    if (!item || !item.id) {
        throw new Error("Invalid menu item");
    }

    await database
        .ref("pistaHouse/menuItems/" + item.id)
        .update(item);

    localStorage.setItem(
        "menuItems",
        JSON.stringify(menuItems)
    );

    console.log(
        "✅ Menu item updated:",
        item.name
    );
}

async function saveMenuToFirebase() {

    if (!Array.isArray(menuItems)) {
        menuItems = [];
    }

    const updates = {};

    menuItems.forEach(function(item) {

        if (!item || !item.id) {
            return;
        }

        updates[
            "pistaHouse/menuItems/" + item.id
        ] = item;

    });

    if (Object.keys(updates).length > 0) {

        await database
            .ref()
            .update(updates);

    }

    localStorage.setItem(
        "menuItems",
        JSON.stringify(menuItems)
    );

    console.log(
        "✅ All menu items saved:",
        menuItems.length
    );

}
            
async function saveFood() {

    try {

        const name =
            document.getElementById("foodName").value.trim();

        const price =
            document.getElementById("foodPrice").value;

        const category =
            document.getElementById("foodCategory").value;

        const time =
            document.getElementById("foodTime").value;

        const imageInput =
            document.getElementById("foodImage");

        const description =
            document
                .getElementById("foodDescription")
                .value
                .trim();

        // Validation
        if (!name) {
            alert("Please enter food name.");
            return;
        }

        if (!price || Number(price) <= 0) {
            alert("Please enter a valid price.");
            return;
        }

        // ==========================
        // EDIT EXISTING ITEM
        // ==========================

        if (editingFoodId !== null) {

            const index =
                menuItems.findIndex(
                    item =>
                        String(item.id) ===
                        String(editingFoodId)
                );

            if (index === -1) {
                alert("Food item not found.");
                return;
            }

            let image =
                menuItems[index].image || "";

            if (
                imageInput &&
                imageInput.files &&
                imageInput.files[0]
            ) {

                image =
                    await readImageFile(
                        imageInput.files[0]
                    );

            }

            const updatedItem = {

                ...menuItems[index],

                name: name,

                price: Number(price),

                category: category,

                preparationTime:
                    Number(time) || 20,

                image: image,

                description: description,

                updatedAt:
                    new Date().toISOString()

            };

            menuItems[index] = updatedItem;

            // Firebase update
            await updateMenuItemToFirebase(
                updatedItem
            );

            localStorage.setItem(
                "menuItems",
                JSON.stringify(menuItems)
            );

            displayMenu();
            closeFoodForm();

            showToast(
                "Food item updated successfully! ✅"
            );

            return;
        }


        // ==========================
        // ADD NEW ITEM
        // ==========================

        let image = "";

        if (
            imageInput &&
            imageInput.files &&
            imageInput.files[0]
        ) {

            image =
                await readImageFile(
                    imageInput.files[0]
                );

        }

        const newFood = {

            id: Date.now(),

            name: name,

            price: Number(price),

            category: category,

            preparationTime:
                Number(time) || 20,

            image: image,

            description: description,

            available: true,

            createdAt:
                new Date().toISOString()

        };


        // Add to array
        menuItems.push(newFood);


        // Save to Firebase
        await saveMenuItemToFirebase(
            newFood
        );


        // Local cache
        localStorage.setItem(
            "menuItems",
            JSON.stringify(menuItems)
        );


        // Refresh UI
        displayMenu();
        updateDashboard();

        closeFoodForm();

        showToast(
            "Food item added successfully! ✅"
        );


        console.log(
            "✅ New food added:",
            newFood.name
        );

    } catch (error) {

        console.error(
            "❌ SAVE FOOD ERROR:",
            error
        );

        alert(
            "Food save failed!\n\n" +
            (error.message || error)
        );

    }

}
    
    
    



function displayMenu() {
    const menuList =

document.getElementById("menuList");
    if (!menuList) return;

    if (menuItems.length === 0) {
        menuList.innerHTML = `
            <div class="card">
                <h3>No menu items yet 🍽️</h3>
                <p>Click "Add Item" to add your first food item.</p>
            </div>
        `;
        return;
    }

    menuList.innerHTML = menuItems.map(item => {
        const image = item.image || "https://via.placeholder.com/600x400?text=Food";
        const availability = item.available !== false;

        return `
            <div class="menu-item">
                <img src="${image}" alt="${escapeHTML(item.name)}" onerror="this.src='https://via.placeholder.com/600x400?text=Food'">
                <div class="menu-info">
                    <h3>${escapeHTML(item.name)}</h3>
                    <span class="menu-category">${escapeHTML(item.category)}</span>
                    <p>${escapeHTML(item.description || "Delicious food")}</p>
                    <p>⏱️ ${item.preparationTime || 20} minutes</p>
                    <div class="menu-price">₹${Number(item.price).toLocaleString("en-IN")}</div>
                    <p style="color:${availability ? "#16a34a" : "#dc2626"}; font-weight:bold;">
                        ${availability ? "🟢 Available" : "🔴 Unavailable"}
                    </p>
                    <div class="menu-actions">
                        <button class="edit-btn" onclick="editFood(${item.id})">✏️ Edit</button>
                        <button class="delete-btn" onclick="deleteFood(${item.id})">🗑️ Delete</button>
                    </div>
                    <button onclick="toggleFoodAvailability(${item.id})" style="width:100%; margin-top:8px; padding:9px; border:none; border-radius:7px; cursor:pointer; background:${availability ? "#fee2e2" : "#dcfce7"}; color:${availability ? "#dc2626" : "#15803d"}; font-weight:bold;">
                        ${availability ? "🔴 Mark Unavailable" : "🟢 Mark Available"}
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function editFood(id) {
    const item = menuItems.find(food => food.id === id);
    if (!item) return;

    editingFoodId = id;
    document.getElementById("formTitle").innerText = "Edit Menu Item";
    document.getElementById("foodName").value = item.name || "";
    document.getElementById("foodPrice").value = item.price || "";
    document.getElementById("foodCategory").value = item.category || "Starters";
    document.getElementById("foodTime").value = item.preparationTime || 20;
    document.getElementById("foodDescription").value = item.description || "";
    document.getElementById("foodForm").classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteFood(id) {

    const item =
        menuItems.find(
            food =>
                String(food.id) === String(id)
        );

    if (!item) return;

    if (
        !confirm(
            `Delete "${item.name}"?`
        )
    ) {
        return;
    }

    try {

        // Firebase delete
        await database
            .ref(
                "pistaHouse/menuItems/" + id
            )
            .remove();

        // Local delete
        menuItems =
            menuItems.filter(
                food =>
                    String(food.id) !==
                    String(id)
            );

        localStorage.setItem(
            "menuItems",
            JSON.stringify(menuItems)
        );

        displayMenu();
        updateDashboard();

        showToast(
            "Food item deleted successfully! 🗑️"
        );

    } catch (error) {

        console.error(
            "❌ Delete food error:",
            error
        );

        alert(
            "Delete failed!\n\n" +
            (error.message || error)
        );

    }

}


async function toggleFoodAvailability(id) {

    const item =
        menuItems.find(
            food =>
                String(food.id) === String(id)
        );

    if (!item) return;

    try {

        item.available =
            item.available === false
                ? true
                : false;

        item.updatedAt =
            new Date().toISOString();

        // Firebase update
        await database
            .ref(
                "pistaHouse/menuItems/" + id
            )
            .update({
                available: item.available,
                updatedAt: item.updatedAt
            });

        // Local cache
        localStorage.setItem(
            "menuItems",
            JSON.stringify(menuItems)
        );

        displayMenu();

        showToast(
            item.available
                ? "Food marked Available 🟢"
                : "Food marked Unavailable 🔴"
        );

    } catch (error) {

        console.error(
            "❌ Availability update error:",
            error
        );

        alert(
            "Availability update failed!\n\n" +
            (error.message || error)
        );

    }

}

function displayOrders() {
  
    // ------------------------------------------
    // FILTER ORDERS
    // ------------------------------------------

    const now = new Date();

    let filteredOrders = [...orders];


    // TODAY
    if (
        dashboardOrderFilter === "today" ||
        dashboardOrderFilter === "sales"
    ) {

        filteredOrders = orders.filter(function(order) {

            if (!order.createdAt) return false;

            const orderDate =
                new Date(order.createdAt);

            return (
                orderDate.getFullYear() === now.getFullYear() &&
                orderDate.getMonth() === now.getMonth() &&
                orderDate.getDate() === now.getDate()
            );

        });

    }


    // PENDING
    else if (dashboardOrderFilter === "pending") {

        filteredOrders = orders.filter(function(order) {

            return (
                order.status === "Pending" ||
                order.status === "Received"
            );

        });

    }


    // PREPARING
    else if (dashboardOrderFilter === "preparing") {

        filteredOrders = orders.filter(function(order) {

            return order.status === "Preparing";

        });

    }


    // ------------------------------------------
    // FILTER TITLE
    // ------------------------------------------

    let filterTitle = "All Orders";

    if (dashboardOrderFilter === "today") {
        filterTitle = "Today's Orders";
    }

    if (dashboardOrderFilter === "pending") {
        filterTitle = "Pending Orders";
    }

    if (dashboardOrderFilter === "preparing") {
        filterTitle = "Preparing Orders";
    }

    if (dashboardOrderFilter === "sales") {
        filterTitle = "Today's Sales Orders";
    }


    // ------------------------------------------
    // NO ORDERS
    // ------------------------------------------

    if (filteredOrders.length === 0) {

        ordersList.innerHTML = `
            <div class="card">

                <h3>🛎️ No Orders Found</h3>

                <p>
                    No orders available for
                    <strong>${filterTitle}</strong>.
                </p>

            </div>
        `;

        return;
    }


    // ------------------------------------------
    // SORT NEWEST FIRST
    // ------------------------------------------

    const sortedOrders =
        [...filteredOrders].reverse();


    // ------------------------------------------
    // DISPLAY ORDERS
    // ------------------------------------------

    ordersList.innerHTML = `

        <div style="
            margin-bottom:15px;
            font-size:22px;
            font-weight:bold;
        ">
            ${filterTitle}
        </div>

        ${sortedOrders.map(order => {

            const status =
                order.status || "Pending";

            const statusClass =
                status.toLowerCase();


            let itemsHTML = "";

            if (Array.isArray(order.items)) {

                itemsHTML =
                    order.items.map(item => `

                        <div style="
                            display:flex;
                            justify-content:space-between;
                            margin:6px 0;
                        ">

                            <span>
                                ${escapeHTML(
                                    item.name || "Food"
                                )}
                                ×
                                ${Number(
                                    item.quantity || 1
                                )}
                            </span>

                            <strong>
                                ₹${(
                                    Number(item.price || 0) *
                                    Number(item.quantity || 1)
                                ).toLocaleString("en-IN")}
                            </strong>

                        </div>

                    `).join("");

            }


            const orderDate =
                order.createdAt
                    ? new Date(
                        order.createdAt
                    ).toLocaleString("en-IN")
                    : "Recently";


            return `

                <div class="order-card">

                    <div class="order-header">

                        <div>

                            <div class="order-id">
                                🧾 Order #
                                ${escapeHTML(
                                    String(
                                        order.id || "----"
                                    )
                                )}
                            </div>

                            <div class="order-customer">
                                👤
                                ${escapeHTML(
                                    order.customerName ||
                                    order.name ||
                                    "Customer"
                                )}
                            </div>

                        </div>


                        <span class="status ${statusClass}">

                            ${getStatusIcon(status)}

                            ${escapeHTML(status)}

                        </span>

                    </div>


                    <div>

                        📞
                        ${escapeHTML(
                            String(
                                order.customerPhone ||
                                order.phone ||
                                "No phone"
                            )
                        )}

                        <br>

                        🪑 Table
                        ${escapeHTML(
                            String(
                                order.tableNumber ||
                                order.table ||
                                "-"
                            )
                        )}

                    </div>


                    <div class="order-items">

                        <strong>
                            Ordered Items
                        </strong>

                        <div style="margin-top:10px;">
                            ${itemsHTML}
                        </div>

                    </div>


                    ${
                        order.note
                            ? `
                                <p style="
                                    background:#f8fafc;
                                    padding:10px;
                                    border-radius:8px;
                                    margin-bottom:10px;
                                ">
                                    📝
                                    <strong>Note:</strong>
                                    ${escapeHTML(
                                        String(order.note)
                                    )}
                                </p>
                            `
                            : ""
                    }


                    <div class="order-total">

                        Total:
                        ₹${Number(
                            order.total || 0
                        ).toLocaleString("en-IN")}

                    </div>


                    <p style="
                        color:#6b7280;
                        font-size:12px;
                        margin-top:7px;
                    ">

                        ${orderDate}

                    </p>


                    <div class="order-actions">

                        <button
                            onclick="changeOrderStatus(
                                '${order.id}',
                                'Confirmed'
                            )"
                            style="
                                background:#dbeafe;
                                color:#1d4ed8;
                            "
                        >
                            ✓ Confirm
                        </button>


                        <button
                            onclick="changeOrderStatus(
                                '${order.id}',
                                'Preparing'
                            )"
                            style="
                                background:#ffedd5;
                                color:#c2410c;
                            "
                        >
                            🍳 Preparing
                        </button>


                        <button
                            onclick="changeOrderStatus(
                                '${order.id}',
                                'Ready'
                            )"
                            style="
                                background:#dcfce7;
                                color:#15803d;
                            "
                        >
                            🍽️ Ready
                        </button>


                        <button
                            onclick="changeOrderStatus(
                                '${order.id}',
                                'Served'
                            )"
                            style="
                                background:#d1fae5;
                                color:#047857;
                            "
                        >
                            ✓ Served
                        </button>


                        <button
                            onclick="deleteOrder(
                                '${order.id}'
                            )"
                            style="
                                background:#fee2e2;
                                color:#dc2626;
                            "
                        >
                            🗑️ Delete
                        </button>

                    </div>

                </div>

            `;

        }).join("")}

    `;

}

function getStatusIcon(status) {
    if (status === "Confirmed") return "✓";
    if (status === "Preparing") return "🍳";
    if (status === "Ready") return "🍽️";
    if (status === "Served") return "✓";
    return "⏳";
}

async function changeOrderStatus(orderId, newStatus) {
    const index = orders.findIndex(order => String(order.id) === String(orderId));
    if (index === -1) {
        alert("Order not found.");
        return;
    }

    orders[index].status = newStatus;
    orders[index].updatedAt = new Date().toISOString();

    localStorage.setItem("orders", JSON.stringify(orders));
    displayOrders();
    updateDashboard();

  try {
        await database.ref("pistaHouse/orders/" + orderId).update({
            status: newStatus,
            updatedAt: orders[index].updatedAt
        });
    } catch (error) {
        console.error("❌ Firebase Status Update Error:", error);
  }
  
}

async function deleteOrder(orderId) {
    if (!confirm("Delete Order #" + orderId + "?")) return;

    orders = orders.filter(order => String(order.id) !== String(orderId));
    localStorage.setItem("orders", JSON.stringify(orders));
    displayOrders();
    updateDashboard();
  
  try {
        await database.ref("pistaHouse/orders/" + orderId).remove();
    } catch (error) {
        console.error("❌ Firebase Delete Order Error:", error);
  }
}


let restaurantTables = JSON.parse(localStorage.getItem("restaurantTables")) || [];

function displayTables() {
    const tableList = document.getElementById("tableList");
    if (!tableList) return;

    const customerURL = "https://gksiddalingaswamy.github.io/pista-house-menu/customer.html";
    const qrURL = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&color=1a5632&bgcolor=ffffff&data=" + encodeURIComponent(customerURL);

    tableList.innerHTML = `
        <div class="qr-card-branded">
            <img src="logo.png" class="qr-card-logo-banner" alt="Pista House Ballari">
            <div class="qr-image-wrapper">
                <img src="${qrURL}" alt="Restaurant QR Code" class="qr-image">
                <img src="logo.png" class="qr-center-logo" alt="Pista House">
            </div>
            <p class="qr-scan-text">SCAN TO OPEN MENU</p>
            <button class="qr-btn-branded" onclick="downloadQR()">
                ⬇️ Download QR
            </button>
        </div>
    `;
}

  function closeQRPreview() {
    const modal = document.getElementById("qrPreviewModal");

    if (modal) {
        modal.classList.remove("show");
    }
  }
  
function downloadQR() {
    const qrImage = "qr.png";
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = "Pista-House-Ballari-QR.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function regenerateTables() {
    if (!confirm("This will replace the existing tables. Continue?")) return;
    localStorage.removeItem("restaurantTables");
    restaurantTables = [];
    displayTables();
}

// HTML Protection
function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Image File Reader


function showToast(message, type) {
    const toast = document.getElementById("toastNotification");
    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent = message;
    toast.className = "toast show" + (type === "error" ? " error" : "");

    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}

function readImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                const maxWidth = 800;
                const maxHeight = 600;

                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const compressedImage = canvas.toDataURL("image/jpeg", 0.6);
                resolve(compressedImage);
            };

            img.onerror = () => reject(new Error("Image processing failed"));
            img.src = event.target.result;
        };

        reader.onerror = () => reject(new Error("Image reading failed"));
        reader.readAsDataURL(file);
    });
}

// Bootstrapping
function initializeAdmin() {

    // 1. Restaurant data immediately
    loadRestaurant();

    // 1.5 Admin push notification setup
    setupAdminPushNotifications();

    // 2. Show local cached data immediately
    try {
        const savedMenu = localStorage.getItem("menuItems");

        if (savedMenu) {
            const parsedMenu = JSON.parse(savedMenu);

            if (Array.isArray(parsedMenu)) {
                menuItems = parsedMenu;
            }
        }
    } catch (error) {
        console.error("Local menu load error:", error);
    }

    try {
        const savedOrders = localStorage.getItem("orders");

        if (savedOrders) {
            const parsedOrders = JSON.parse(savedOrders);

            if (Array.isArray(parsedOrders)) {
                orders = parsedOrders;
            }
        }
    } catch (error) {
        console.error("Local orders load error:", error);
    }

    // 3. Render page immediately
    updateDashboard();
    displayMenu();
    displayOrders();
    displayTables();

// Firebase Orders - REALTIME SYNC
listenForOrderUpdates();

// Firebase Menu
loadMenuFromFirebase()
    .then(function() {
        displayMenu();
        updateDashboard();

        console.log("✅ Firebase menu synced");
    })
    .catch(function(error) {

        console.error(
            "❌ Firebase menu background sync failed:",
            error
        );

    });

}

    

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAdmin);
} else {
    initializeAdmin();
}
