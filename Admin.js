// ==========================================
// PISTA HOUSE BALLARI - ADMIN JS
// STEP 1
// ==========================================


// ------------------------------------------
// GLOBAL DATA
// ------------------------------------------

let menuItems = JSON.parse(
    localStorage.getItem("menuItems")
) || [];

let orders = JSON.parse(
    localStorage.getItem("orders")
) || [];


// ------------------------------------------
// PAGE NAVIGATION
// ------------------------------------------

function showSection(sectionId) {

    const sections = document.querySelectorAll(".section");

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

        const text = button.innerText.toLowerCase();

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
                text.includes("tables"))
        ) {

            button.classList.add("active");

        }

    });


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

}


// ------------------------------------------
// RESTAURANT DETAILS
// ------------------------------------------

function saveRestaurant() {

    const restaurant = {

        name:
            document.getElementById(
                "restaurantName"
            ).value.trim(),

        phone:
            document.getElementById(
                "restaurantPhone"
            ).value.trim(),

        address:
            document.getElementById(
                "restaurantAddress"
            ).value.trim(),

        instagram:
            document.getElementById(
                "restaurantInstagram"
            ).value.trim(),

        openingTime:
            document.getElementById(
                "openingTime"
            ).value,

        closingTime:
            document.getElementById(
                "closingTime"
            ).value,

        preparationTime:
            document.getElementById(
                "preparationTime"
            ).value,

        priceRange:
            document.getElementById(
                "priceRange"
            ).value.trim(),

        description:
            document.getElementById(
                "restaurantDescription"
            ).value.trim()

    };


    localStorage.setItem(
        "restaurantDetails",
        JSON.stringify(restaurant)
    );


    alert(
        "Restaurant details saved successfully! ✅"
    );

}


// ------------------------------------------
// LOAD RESTAURANT DETAILS
// ------------------------------------------

function loadRestaurant() {

    const saved =
        localStorage.getItem(
            "restaurantDetails"
        );


    if (!saved) {
        return;
    }


    const restaurant =
        JSON.parse(saved);


    if (document.getElementById("restaurantName")) {

        document.getElementById(
            "restaurantName"
        ).value =
            restaurant.name || "Pista House Ballari";


        document.getElementById(
            "restaurantPhone"
        ).value =
            restaurant.phone || "+91 99662 28888";


        document.getElementById(
            "restaurantAddress"
        ).value =
            restaurant.address || "";


        document.getElementById(
            "restaurantInstagram"
        ).value =
            restaurant.instagram || "";


        document.getElementById(
            "openingTime"
        ).value =
            restaurant.openingTime || "06:00";


        document.getElementById(
            "closingTime"
        ).value =
            restaurant.closingTime || "23:00";


        document.getElementById(
            "preparationTime"
        ).value =
            restaurant.preparationTime || "25";


        document.getElementById(
            "priceRange"
        ).value =
            restaurant.priceRange || "";


        document.getElementById(
            "restaurantDescription"
        ).value =
            restaurant.description || "";

    }

}


// ------------------------------------------
// DASHBOARD
// ------------------------------------------

function updateDashboard() {

    const totalOrders =
        orders.length;


    const pendingOrders =
        orders.filter(
            order => order.status === "Pending"
        ).length;


    const preparingOrders =
        orders.filter(
            order => order.status === "Preparing"
        ).length;


    const sales =
        orders.reduce(
            (total, order) => {

                return total +
                    Number(
                        order.total || 0
                    );

            },
            0
        );


    const totalElement =
        document.getElementById(
            "totalOrders"
        );

    const pendingElement =
        document.getElementById(
            "pendingOrders"
        );

    const preparingElement =
        document.getElementById(
            "preparingOrders"
        );

    const salesElement =
        document.getElementById(
            "salesAmount"
        );


    if (totalElement) {
        totalElement.innerText =
            totalOrders;
    }


    if (pendingElement) {
        pendingElement.innerText =
            pendingOrders;
    }


    if (preparingElement) {
        preparingElement.innerText =
            preparingOrders;
    }


    if (salesElement) {
        salesElement.innerText =
            "₹" +
            sales.toLocaleString("en-IN");
    }

}


// ------------------------------------------
// LOGOUT
// ------------------------------------------

function logout() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmLogout) {
        return;
    }


    window.location.href =
        "index.html";

}


// ------------------------------------------
// INITIAL LOAD
// ------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadRestaurant();

        updateDashboard();

        displayMenu();

        displayOrders();

        displayTables();

    }
);

// ==========================================
// MENU MANAGEMENT
// STEP 2
// ==========================================

let editingFoodId = null;


// ------------------------------------------
// OPEN ADD FOOD FORM
// ------------------------------------------

function openFoodForm() {

    const form =
        document.getElementById("foodForm");

    if (!form) return;

    form.classList.remove("hidden");

    editingFoodId = null;

    document.getElementById("formTitle").innerText =
        "Add Menu Item";

    clearFoodForm();

}


// ------------------------------------------
// CLOSE FOOD FORM
// ------------------------------------------

function closeFoodForm() {

    const form =
        document.getElementById("foodForm");

    if (!form) return;

    form.classList.add("hidden");

    editingFoodId = null;

    clearFoodForm();

}


// ------------------------------------------
// CLEAR FORM
// ------------------------------------------

function clearFoodForm() {

    const name =
        document.getElementById("foodName");

    const price =
        document.getElementById("foodPrice");

    const category =
        document.getElementById("foodCategory");

    const time =
        document.getElementById("foodTime");

    const image =
        document.getElementById("foodImage");

    const description =
        document.getElementById("foodDescription");


    if (name) name.value = "";

    if (price) price.value = "";

    if (category) category.value = "Starters";

    if (time) time.value = "20";

    if (image) image.value = "";

    if (description) description.value = "";

}


// ------------------------------------------
// SAVE FOOD
// ------------------------------------------

async function saveFood() {

    const name =
        document.getElementById("foodName")
        .value
        .trim();

    const price =
        document.getElementById("foodPrice")
        .value;

    const category =
        document.getElementById("foodCategory")
        .value;

    const time =
        document.getElementById("foodTime")
        .value;

    const image = document.getElementById("foodImage").files[0]
    ? await readImageFile(document.getElementById("foodImage").files[0])
    : "";

    const description =
        document.getElementById("foodDescription")
        .value
        .trim();


    // VALIDATION

    if (!name) {

        alert("Please enter food name.");

        return;
    }


    if (!price || Number(price) <= 0) {

        alert("Please enter a valid price.");

        return;
    }


    // EDIT EXISTING ITEM

    if (editingFoodId !== null) {

        const index =
            menuItems.findIndex(
                item =>
                    item.id === editingFoodId
            );


        if (index !== -1) {

            menuItems[index] = {

                ...menuItems[index],

                name: name,

                price: Number(price),

                category: category,

                preparationTime:
                    Number(time) || 20,

                image: image,

                description: description

            };

        }

    }

    // ADD NEW ITEM

    else {

        const newFood = {

            id:
                Date.now(),

            name: name,

            price:
                Number(price),

            category: category,

            preparationTime:
                Number(time) || 20,

            image: image,

            description: description,

            available: true,

            createdAt:
                new Date().toISOString()

        };


        menuItems.push(newFood);
      localStorage.setItem(
    "menuItems",
    JSON.stringify(menuItems)
);

    }


    // SAVE

    localStorage.setItem(
        "menuItems",
        JSON.stringify(menuItems)
    );


    // REFRESH

    displayMenu();

    closeFoodForm();


    alert(
        editingFoodId !== null
            ? "Food item updated successfully! ✅"
            : "Food item added successfully! ✅"
    );

}


// ------------------------------------------
// DISPLAY MENU
// ------------------------------------------

function displayMenu() {

    const menuList =
        document.getElementById("menuList");


    if (!menuList) return;


    if (menuItems.length === 0) {

        menuList.innerHTML = `

            <div class="card">

                <h3>No menu items yet 🍽️</h3>

                <p>
                    Click "Add Item" to add your
                    first food item.
                </p>

            </div>

        `;

        return;
    }


    menuList.innerHTML =
        menuItems
        .map(item => {

            const image =
                item.image ||
                "https://via.placeholder.com/600x400?text=Food";


            const availability =
                item.available !== false;


            return `

                <div class="menu-item">

                    <img
                        src="${image}"
                        alt="${escapeHTML(item.name)}"
                        onerror="this.src='https://via.placeholder.com/600x400?text=Food'"
                    >


                    <div class="menu-info">

                        <h3>
                            ${escapeHTML(item.name)}
                        </h3>


                        <span class="menu-category">
                            ${escapeHTML(item.category)}
                        </span>


                        <p>
                            ${escapeHTML(
                                item.description || 
                                "Delicious food"
                            )}
                        </p>


                        <p>
                            ⏱️
                            ${item.preparationTime || 20}
                            minutes
                        </p>


                        <div class="menu-price">
                            ₹${Number(item.price).toLocaleString("en-IN")}
                        </div>


                        <p style="
                            color:${availability ? "#16a34a" : "#dc2626"};
                            font-weight:bold;
                        ">

                            ${availability
                                ? "🟢 Available"
                                : "🔴 Unavailable"
                            }

                        </p>


                        <div class="menu-actions">

                            <button
                                class="edit-btn"
                                onclick="editFood(${item.id})"
                            >
                                ✏️ Edit
                            </button>


                            <button
                                class="delete-btn"
                                onclick="deleteFood(${item.id})"
                            >
                                🗑️ Delete
                            </button>

                        </div>


                        <button
                            onclick="toggleFoodAvailability(${item.id})"
                            style="
                                width:100%;
                                margin-top:8px;
                                padding:9px;
                                border:none;
                                border-radius:7px;
                                cursor:pointer;
                                background:${availability ? "#fee2e2" : "#dcfce7"};
                                color:${availability ? "#dc2626" : "#15803d"};
                                font-weight:bold;
                            "
                        >

                            ${availability
                                ? "🔴 Mark Unavailable"
                                : "🟢 Mark Available"
                            }

                        </button>

                    </div>

                </div>

            `;

        })
        .join("");

}


// ------------------------------------------
// EDIT FOOD
// ------------------------------------------

function editFood(id) {

    const item =
        menuItems.find(
            food => food.id === id
        );


    if (!item) return;


    editingFoodId = id;


    document.getElementById(
        "formTitle"
    ).innerText =
        "Edit Menu Item";


    document.getElementById(
        "foodName"
    ).value =
        item.name || "";


    document.getElementById(
        "foodPrice"
    ).value =
        item.price || "";


    document.getElementById(
        "foodCategory"
    ).value =
        item.category || "Starters";


    document.getElementById(
        "foodTime"
    ).value =
        item.preparationTime || 20;


    document.getElementById(
        "foodImage"
    ).value =
        item.image || "";


    document.getElementById(
        "foodDescription"
    ).value =
        item.description || "";


    document.getElementById(
        "foodForm"
    ).classList.remove("hidden");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ------------------------------------------
// DELETE FOOD
// ------------------------------------------

function deleteFood(id) {

    const item =
        menuItems.find(
            food => food.id === id
        );


    if (!item) return;


    const confirmDelete =
        confirm(
            `Delete "${item.name}"?`
        );


    if (!confirmDelete) return;


    menuItems =
        menuItems.filter(
            food => food.id !== id
        );


    localStorage.setItem(
        "menuItems",
        JSON.stringify(menuItems)
    );


    displayMenu();

    updateDashboard();

}


// ------------------------------------------
// AVAILABLE / UNAVAILABLE
// ------------------------------------------

function toggleFoodAvailability(id) {

    const item =
        menuItems.find(
            food => food.id === id
        );


    if (!item) return;


    item.available =
        item.available === false
            ? true
            : false;


    localStorage.setItem(
        "menuItems",
        JSON.stringify(menuItems)
    );


    displayMenu();

}


// ------------------------------------------
// ESCAPE HTML
// ------------------------------------------

function escapeHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}

// ==========================================
// ORDERS MANAGEMENT
// STEP 3 - CORRECTED
// ==========================================

function displayOrders() {

    const ordersList = document.getElementById("ordersList");

    if (!ordersList) return;

    if (orders.length === 0) {

        ordersList.innerHTML = `
            <div class="card">
                <h3>🛎️ No Orders Yet</h3>
                <p>Customer orders will appear here.</p>
            </div>
        `;

        return;
    }

    const sortedOrders = [...orders].reverse();

    ordersList.innerHTML = sortedOrders.map(function(order) {

        const status = order.status || "Pending";

        const statusClass = status.toLowerCase();

        let itemsHTML = "";

        if (Array.isArray(order.items)) {

            itemsHTML = order.items.map(function(item) {

                const quantity = Number(item.quantity || 1);
                const price = Number(item.price || 0);

                return `
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        margin:6px 0;
                    ">
                        <span>
                            ${escapeHTML(item.name || "Food")}
                            × ${quantity}
                        </span>

                        <strong>
                            ₹${(price * quantity).toLocaleString("en-IN")}
                        </strong>
                    </div>
                `;

            }).join("");
        }

        const orderDate = order.createdAt
            ? new Date(order.createdAt).toLocaleString("en-IN")
            : "Recently";

        return `
            <div class="order-card">

                <div class="order-header">

                    <div>

                        <div class="order-id">
                            🧾 Order #${escapeHTML(String(order.id || "----"))}
                        </div>

                        <div class="order-customer">
                            👤 ${escapeHTML(
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

📞 ${escapeHTML(
    String(order.customerPhone || order.phone || "No phone")
)}

                    <br>

                    🪑 Table ${escapeHTML(
                        String(
                            order.tableNumber ||
                            order.table ||
                            "-"
                        )
                    )}

                </div>


                <div class="order-items">

                    <strong>Ordered Items</strong>

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
                            📝 <strong>Note:</strong>
                            ${escapeHTML(String(order.note))}
                        </p>
                    `
                    : ""
                }


                <div class="order-total">
                    Total:
                    ₹${Number(order.total || 0).toLocaleString("en-IN")}
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
                        onclick="changeOrderStatus('${order.id}', 'Confirmed')"
                        style="
                            background:#dbeafe;
                            color:#1d4ed8;
                        "
                    >
                        ✓ Confirm
                    </button>


                    <button
                        onclick="changeOrderStatus('${order.id}', 'Preparing')"
                        style="
                            background:#ffedd5;
                            color:#c2410c;
                        "
                    >
                        🍳 Preparing
                    </button>


                    <button
                        onclick="changeOrderStatus('${order.id}', 'Ready')"
                        style="
                            background:#dcfce7;
                            color:#15803d;
                        "
                    >
                        🍽️ Ready
                    </button>


                    <button
                        onclick="changeOrderStatus('${order.id}', 'Served')"
                        style="
                            background:#d1fae5;
                            color:#047857;
                        "
                    >
                        ✓ Served
                    </button>


                    <button
                        onclick="deleteOrder('${order.id}')"
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

    }).join("");
}


// ==========================================
// STATUS ICON
// ==========================================

function getStatusIcon(status) {

    if (status === "Confirmed") {
        return "✓";
    }

    if (status === "Preparing") {
        return "🍳";
    }

    if (status === "Ready") {
        return "🍽️";
    }

    if (status === "Served") {
        return "✓";
    }

    return "⏳";
}


// ==========================================
// CHANGE ORDER STATUS
// ==========================================

function changeOrderStatus(orderId, newStatus) {

    const index = orders.findIndex(function(order) {

        return String(order.id) === String(orderId);

    });


    if (index === -1) {

        alert("Order not found.");

        return;
    }


    orders[index].status = newStatus;

    orders[index].updatedAt =
        new Date().toISOString();


    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    displayOrders();

    updateDashboard();


    localStorage.setItem(
    "orders",
    JSON.stringify(orders)
);

displayOrders();

updateDashboard();
}


// ==========================================
// DELETE ORDER
// ==========================================

function deleteOrder(orderId) {

    const confirmDelete = confirm(
        "Delete Order #" + orderId + "?"
    );


    if (!confirmDelete) {
        return;
    }


    orders = orders.filter(function(order) {

        return String(order.id) !== String(orderId);

    });


    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    displayOrders();

    updateDashboard();

}


// ==========================================
// REFRESH ORDERS
// ==========================================

function refreshOrders() {

    orders =
        JSON.parse(
            localStorage.getItem("orders")
        ) || [];


    displayOrders();

    updateDashboard();
}


// ==========================================
// AUTO REFRESH
// ==========================================

setInterval(function() {

    refreshOrders();

}, 3000);

// ==========================================
// TABLES & QR GENERATOR
// STEP 4
// ==========================================

let restaurantTables =
    JSON.parse(
        localStorage.getItem("restaurantTables")
    ) || [];


// ------------------------------------------
// GENERATE TABLES
// ------------------------------------------
function displayTables() {

    const tableList =
        document.getElementById("tableList");

    if (!tableList) return;

    restaurantTables =
        JSON.parse(
            localStorage.getItem("restaurantTables")
        ) || [];

    if (restaurantTables.length === 0) {

        tableList.innerHTML = `
            <div class="card">

                <h3>🪑 No Tables Created</h3>

                <p>
                    Enter the number of tables
                    and generate QR codes.
                </p>

            </div>
        `;

        return;
    }

    const baseURL =
        window.location.href
        .split("/")
        .slice(0, -1)
        .join("/");

    const customerURL =
        `${baseURL}/customer.html`;

    const qrURL =
        "https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&color=1a5632&bgcolor=ffffff&data=" +
        encodeURIComponent(customerURL);

    tableList.innerHTML = `

        <div class="qr-card-branded">

            <img
                src="logo.png"
                class="qr-card-logo-banner"
                alt="Pista House Ballari"
            >

            <div class="qr-image-wrapper">

                <img
                    src="${qrURL}"
                    alt="Restaurant QR Code"
                    class="qr-image"
                >

                <img
                    src="logo.png"
                    class="qr-center-logo"
                    alt="Pista House"
                >

            </div>

            <p class="qr-scan-text">
                SCAN TO OPEN MENU
            </p>

            <button
                class="qr-btn-branded"
                onclick="downloadQR(
                    '${qrURL}',
                    'Restaurant'
                )"
            >
                ⬇️ Download QR
            </button>

        </div>

    `;
}



// ------------------------------------------
// DISPLAY TABLES
// ------------------------------------------


// ======================================================
// DOWNLOAD QR IMAGE
// ======================================================

function downloadQR() {

    const qrImage = "qr.png";

    const link = document.createElement("a");

    link.href = qrImage;
    link.download = "Pista-House-Ballari-QR.png";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

}
           




// ------------------------------------------
// REGENERATE TABLES
// ------------------------------------------

function regenerateTables() {

    const confirmAction =
        confirm(
            "This will replace the existing tables. Continue?"
        );


    if (!confirmAction) return;


    localStorage.removeItem(
        "restaurantTables"
    );


    restaurantTables = [];


    displayTables();

}


// ------------------------------------------
// INITIAL TABLE LOAD
// ------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    function () {

        displayTables();

    }
);

// ==========================================
// STEP 5 - ADMIN INITIALIZATION
// ==========================================

function initializeAdmin() {

    // Load saved restaurant details
    loadRestaurant();

    // Update dashboard
    updateDashboard();

    // Display menu
    displayMenu();

    // Display orders
    displayOrders();

    // Display tables
    displayTables();

}


// ==========================================
// START ADMIN
// ==========================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAdmin
    );

} else {

    initializeAdmin();

}

function readImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}



