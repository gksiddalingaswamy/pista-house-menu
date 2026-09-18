// ======================================================
// CUSTOMER.JS - COMPLETE
// STEP 1 - MENU + SEARCH + CATEGORY + CART
// ======================================================

let menuItems = [];
let cart = [];
let selectedCategory = "All";
let currentOrderId = null;


// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    loadCart();
    loadMenu();
    setupSearch();
  startOrderStatusListener();
  requestNotificationPermission();

    // RESTORE CUSTOMER DETAILS
    try {

        const savedPhone =
            localStorage.getItem("customerPhone") || "";

        const savedName =
            localStorage.getItem("customerName") || "";

        const phoneInput =
            document.getElementById("customerPhone");

        const nameInput =
            document.getElementById("customerName");

        if (phoneInput && savedPhone) {
            phoneInput.value = savedPhone;
        }

        if (nameInput && savedName) {
            nameInput.value = savedName;
        }

    } catch (error) {

        console.error(
            "Customer details restore error:",
            error
        );

    }

});


// ======================================================
// LOAD MENU
// ======================================================

async function loadMenu() {

    // 1. Show local cached menu immediately
    try {

        const savedMenu =
            localStorage.getItem("menuItems");

        if (savedMenu) {

            const cachedMenu =
                JSON.parse(savedMenu);

            if (Array.isArray(cachedMenu) &&
                cachedMenu.length > 0) {

                menuItems = cachedMenu;

                displayCategories();
                displayCustomerMenu();
            }
        }

    } catch (error) {

        console.error(
            "❌ Cache Menu Error:",
            error
        );

    }


    // 2. Get latest menu from Firebase
    try {

        const snapshot =
            await database
                .ref("pistaHouse/menuItems")
                .once("value");

        const firebaseMenu =
            snapshot.val();


        // Firebase object format
        if (
            firebaseMenu &&
            !Array.isArray(firebaseMenu) &&
            typeof firebaseMenu === "object"
        ) {

            menuItems =
                Object.values(firebaseMenu);

        }


        // Firebase array format
        else if (Array.isArray(firebaseMenu)) {

            menuItems =
                firebaseMenu;

        }


        // 3. Save latest Firebase menu to cache
        localStorage.setItem(
            "menuItems",
            JSON.stringify(menuItems)
        );


        // 4. Refresh categories + food
        displayCategories();
        displayCustomerMenu();


        console.log(
            "✅ Latest Firebase Menu Loaded:",
            menuItems.length
        );


    } catch (error) {

        console.error(
            "❌ Firebase Menu Error:",
            error
        );


        // If Firebase fails,
        // cached menu is already displayed
        displayCategories();
        displayCustomerMenu();

    }

}


// ======================================================
// CATEGORIES
// ======================================================

function displayCategories() {

    const container =
        document.getElementById(
            "categoryButtons"
        );

    if (!container) return;

    const categories = ["All"];

    menuItems.forEach(function (item) {

        if (
            item.category &&
            !categories.includes(item.category)
        ) {

            categories.push(item.category);

        }

    });

    container.innerHTML =
        categories.map(function (category) {

            return `
                <button
                    class="category-btn ${
                        category === selectedCategory
                            ? "active"
                            : ""
                    }"
                    onclick="selectCategory('${escapeHTML(category)}')">

                    ${escapeHTML(category)}

                </button>
            `;

        }).join("");

}


// ======================================================
// SELECT CATEGORY
// ======================================================

function selectCategory(category) {

    selectedCategory = category;

    displayCategories();
    displayCustomerMenu();

}


// ======================================================
// DISPLAY CUSTOMER MENU
// ======================================================

function displayCustomerMenu() {

    const container =
        document.getElementById(
            "customerMenu"
        );

    if (!container) return;

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    const searchText =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";

    const filteredItems =
        menuItems.filter(function (item) {

            const categoryMatch =
                selectedCategory === "All" ||
                item.category === selectedCategory;

            const name =
                String(item.name || "")
                    .toLowerCase();

            const description =
                String(item.description || "")
                    .toLowerCase();

            const searchMatch =
                !searchText ||
                name.includes(searchText) ||
                description.includes(searchText);

            return (
                categoryMatch &&
                searchMatch
            );

        });


    if (filteredItems.length === 0) {

        container.innerHTML = `
            <div class="empty-menu">

                <div style="font-size:45px;">
                    🍽️
                </div>

                <h3>
                    No food items found
                </h3>

                <p>
                    Try another category or search.
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML =
        filteredItems.map(function (item) {

            const image =
                item.image ||
                "https://via.placeholder.com/600x400?text=Food";

            const price =
                Number(item.price || 0);

            const prepTime =
    Number(item.preparationTime || 0);

            const available =
                item.available !== false;


            return `
                <div class="food-card">

                    <div class="food-image-container">

                        <img
                            src="${image}"
                            alt="${escapeHTML(
                                String(
                                    item.name ||
                                    "Food"
                                )
                            )}"
                            class="food-image"
                            onerror="this.src='https://via.placeholder.com/600x400?text=Food'"
                        >

                    </div>


                    <div class="food-info">

                        <h3>
                            ${escapeHTML(
                                String(
                                    item.name ||
                                    "Food"
                                )
                            )}
                        </h3>


                        ${
                            item.description
                                ? `
                                    <p class="food-description">
                                        ${escapeHTML(
                                            String(
                                                item.description
                                            )
                                        )}
                                    </p>
                                `
                                : ""
                        }


                        <div class="food-bottom">

                            <div>

                                <div class="food-price">
                                    ₹${price}
                                </div>

                                ${
                                    prepTime
                                        ? `
                                            <div class="prep-time">
                                                ⏱️ ${prepTime} min
                                            </div>
                                        `
                                        : ""
                                }

                            </div>


                            ${
                                available
                                    ? `
                                        <button
                                            class="add-cart-btn"
                                            onclick="addToCart('${escapeHTML(
                                                String(
                                                    item.id
                                                )
                                            )}')">

                                            + Add

                                        </button>
                                    `
                                    : `
                                        <button
                                            class="add-cart-btn"
                                            disabled>

                                            Unavailable

                                        </button>
                                    `
                            }

                        </div>

                    </div>

                </div>
            `;

        }).join("");

}


// ======================================================
// SEARCH
// ======================================================

function setupSearch() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    if (!searchInput) return;

    searchInput.addEventListener(
        "input",
        function () {

            displayCustomerMenu();

        }
    );

}


// ======================================================
// ADD TO CART
// ======================================================

function addToCart(itemId) {

    const item =
        menuItems.find(function (food) {

            return String(food.id) ===
                String(itemId);

        });


    if (!item) {

        alert("Food item not found.");
        return;

    }


    if (item.available === false) {

        alert("This item is unavailable.");
        return;

    }


    const existing =
        cart.find(function (food) {

            return String(food.id) ===
                String(item.id);

        });


    if (existing) {

        existing.quantity += 1;

    } else {

        // IMPORTANT:
        // Image is NOT saved in cart.
        // This prevents localStorage quota problems.

        cart.push({

            id: item.id,

            name: item.name,

            price: Number(item.price || 0),

            quantity: 1,

prepTime:
    Number(item.preparationTime || 0)
});
    
    }


    saveCart();
    updateCartUI();

}


// ======================================================
// SAVE CART
// ======================================================

function saveCart() {

    try {

        const smallCart =
            cart.map(function (item) {

                return {

                    id: item.id,

                    name: item.name,

                    price:
                        Number(item.price || 0),

                    quantity:
                        Number(item.quantity || 1),

                    prepTime:
                        Number(
                            item.prepTime || 0
                        )

                };

            });


        localStorage.setItem(
            "cart",
            JSON.stringify(smallCart)
        );

    } catch (error) {

        console.error(
            "Cart save error:",
            error
        );

    }

}


// ======================================================
// LOAD CART
// ======================================================

function loadCart() {

    try {

        const savedCart =
            localStorage.getItem("cart");

        if (savedCart) {

            const parsedCart =
                JSON.parse(savedCart);

            cart =
                Array.isArray(parsedCart)
                    ? parsedCart
                    : [];

        } else {

            cart = [];

        }

    } catch (error) {

        console.error(
            "Cart loading error:",
            error
        );

        cart = [];

    }

    updateCartUI();

}


// ======================================================
// CART COUNT
// ======================================================

function updateCartUI() {

    const countElement =
        document.getElementById(
            "cartCount"
        );

    if (countElement) {

        const count =
            cart.reduce(
                function (total, item) {

                    return total +
                        Number(
                            item.quantity || 0
                        );

                },
                0
            );

        countElement.textContent =
            count;

    }

}


// ======================================================
// CART TOTAL
// ======================================================

function getCartTotal() {

    return cart.reduce(
        function (total, item) {

            return total +
                Number(item.price || 0) *
                Number(item.quantity || 0);

        },
        0
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// ======================================================
// STEP 2 - CART + CHECKOUT + PLACE ORDER
// ======================================================


// ======================================================
// OPEN CART
// ======================================================

function openCart() {

    const modal =
        document.getElementById("cartModal");

    if (!modal) return;

    displayCartItems();

    modal.classList.remove("hidden");
}


// ======================================================
// CLOSE CART
// ======================================================

function closeCart() {

    const modal =
        document.getElementById("cartModal");

    if (!modal) return;

    modal.classList.add("hidden");

}


// ======================================================
// DISPLAY CART
// ======================================================

function displayCartItems() {

    const container =
        document.getElementById(
            "cartItems"
        );

    const totalElement =
        document.getElementById(
            "cartTotal"
        );


    if (!container) return;


    if (cart.length === 0) {

        container.innerHTML = `
            <div class="empty-cart">

                <div style="font-size:45px;">
                    🛒
                </div>

                <h3>
                    Your cart is empty
                </h3>

                <p>
                    Add some delicious food!
                </p>

            </div>
        `;

        if (totalElement) {

            totalElement.textContent =
                "0";

        }

        return;

    }


    container.innerHTML =
        cart.map(function (item) {

            const quantity =
                Number(
                    item.quantity || 1
                );

            const price =
                Number(
                    item.price || 0
                );

            const itemTotal =
                price * quantity;


            return `
                <div class="cart-item">

                    <div class="cart-item-info">

                        <h3>
                            ${escapeHTML(
                                String(
                                    item.name ||
                                    "Food"
                                )
                            )}
                        </h3>

                        <p>
                            ₹${price} × ${quantity}
                        </p>

                    </div>


                    <div class="cart-item-actions">

                        <button
                            onclick="decreaseCartItem('${escapeHTML(
                                String(item.id)
                            )}')">

                            −

                        </button>


                        <span>
                            ${quantity}
                        </span>


                        <button
                            onclick="increaseCartItem('${escapeHTML(
                                String(item.id)
                            )}')">

                            +

                        </button>

                    </div>


                    <strong>
                        ₹${itemTotal}
                    </strong>

                </div>
            `;

        }).join("");


    if (totalElement) {

        totalElement.textContent =
            getCartTotal();

    }

}


// ======================================================
// INCREASE CART ITEM
// ======================================================

function increaseCartItem(itemId) {

    const item =
        cart.find(function (food) {

            return String(food.id) ===
                String(itemId);

        });


    if (!item) return;


    item.quantity =
        Number(item.quantity || 0) + 1;


    saveCart();
    updateCartUI();
    displayCartItems();

}


// ======================================================
// DECREASE CART ITEM
// ======================================================

function decreaseCartItem(itemId) {

    const index =
        cart.findIndex(function (food) {

            return String(food.id) ===
                String(itemId);

        });


    if (index === -1) return;


    if (
        Number(
            cart[index].quantity
        ) > 1
    ) {

        cart[index].quantity -= 1;

    } else {

        cart.splice(index, 1);

    }


    saveCart();
    updateCartUI();
    displayCartItems();

}


// ======================================================
// OPEN CHECKOUT
// ======================================================

// ======================================================
// OPEN CHECKOUT
// ======================================================

function openCheckout() {

    if (
        !cart ||
        cart.length === 0
    ) {

        alert("Your cart is empty.");
        return;

    }


    closeCart();


    // CLEAR PREVIOUS ORDER DETAILS
    // Every new order starts with fresh fields.

    const nameInput =
        document.getElementById(
            "customerName"
        );

    const phoneInput =
        document.getElementById(
            "customerPhone"
        );

    const tableInput =
        document.getElementById(
            "checkoutTable"
        );

    const noteInput =
        document.getElementById(
            "customerNote"
        );


    if (nameInput) {
        nameInput.value = "";
    }

    if (phoneInput) {
        phoneInput.value = "";
    }

    if (tableInput) {
        tableInput.value = "";
    }

    if (noteInput) {
        noteInput.value = "";
    }


    const modal =
        document.getElementById(
            "checkoutModal"
        );


    if (!modal) {

        alert("Checkout section not found.");
        return;

    }


    modal.classList.remove("hidden");

}

// ======================================================
// CLOSE CHECKOUT
// ======================================================

function closeCheckout() {

    const modal =
        document.getElementById(
            "checkoutModal"
        );

    if (!modal) return;

    modal.classList.add("hidden");

}


// ======================================================
// PLACE ORDER
// ======================================================

async function placeOrder() {

    const nameInput =
        document.getElementById(
            "customerName"
        );

    const phoneInput =
        document.getElementById(
            "customerPhone"
        );

    const tableInput =
        document.getElementById(
            "checkoutTable"
        );

    const noteInput =
        document.getElementById(
            "customerNote"
        );


    const customerName =
        nameInput
            ? nameInput.value.trim()
            : "";


    const customerPhone =
        phoneInput
            ? phoneInput.value.trim()
            : "";

  localStorage.setItem("customerPhone", customerPhone);
localStorage.setItem("customerName", customerName);


    const tableNumber =
        tableInput
            ? tableInput.value.trim()
            : "";


    const customerNote =
        noteInput
            ? noteInput.value.trim()
            : "";


    // VALIDATION

    if (!customerName) {

        alert("Please enter your name.");
        return;

    }


    if (!customerPhone) {

        alert(
            "Please enter your phone number."
        );

        return;

    }


    if (!tableNumber) {

        alert(
            "Please enter table number."
        );

        return;

    }


    if (
        !cart ||
        cart.length === 0
    ) {

        alert("Your cart is empty.");
        return;

    }


    // TOTAL

    const total =
        cart.reduce(
            function (sum, item) {

                return sum +
                    Number(item.price || 0) *
                    Number(item.quantity || 1);

            },
            0
        );


    // ESTIMATED TIME

const estimatedTime = cart.reduce(function(maxTime, item) {
    return Math.max(
        maxTime,
        parseInt(item.prepTime) || 0
);
}, 0);

    // ORDER ID
    // Used internally only.

    const orderId =
        "ORD" + Date.now();


    // ORDER DATA
    // IMPORTANT:
    // NO FOOD IMAGE SAVED HERE.

    const order = {

        id: orderId,

        customerName:
            customerName,

        customerPhone:
            customerPhone,

        table:
            tableNumber,

        note:
            customerNote,

        items:
            cart.map(function (item) {

                return {

                    id: item.id,

                    name: item.name,

                    price:
                        Number(
                            item.price || 0
                        ),

                    quantity:
                        Number(
                            item.quantity || 1
                        ),

                    prepTime:
                        Number(
                            item.prepTime || 0
                        )

                };

            }),

        total:
            total,

        estimatedTime:
            estimatedTime,

        status:
            "Received",

        createdAt:
            new Date().toISOString()

    };


    // LOAD OLD ORDERS

    let orders = [];


    try {

        const savedOrders =
            localStorage.getItem(
                "orders"
            );


        if (savedOrders) {

            const parsedOrders =
                JSON.parse(savedOrders);

            if (
                Array.isArray(
                    parsedOrders
                )
            ) {

                orders =
                    parsedOrders;

            }

        }

    } catch (error) {

        console.error(
            "Orders loading error:",
            error
        );

        orders = [];

    }


    orders.push(order);


// SAVE ORDER TO LOCAL CACHE FIRST
// This makes My Orders load instantly.

try {

    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );

} catch (cacheError) {

    console.error(
        "❌ Local Order Cache Save Error:",
        cacheError
    );

}

// SAVE ORDER TO FIREBASE

try {

    await database
        .ref("pistaHouse/orders/" + order.id)
        .set(order);

    console.log(
        "✅ Order saved to Firebase:",
        order.id
    );

} catch (error) {

    console.error(
        "❌ Firebase Order Save Error:",
        error
    );

    alert(
        "Order save failed. Please try again."
    );

    return;
}



    // CURRENT ORDER

    currentOrderId =
        orderId;


    try {

        localStorage.setItem(
            "currentOrderId",
            orderId
        );

    } catch (error) {

        console.error(
            "Current order save error:",
            error
        );

    }


    // SHOW SUCCESS

    showOrderSuccess(order);


    // CLEAR CART

    cart = [];

    saveCart();

    updateCartUI();

}


// ======================================================
// ORDER SUCCESS
// ======================================================

function showOrderSuccess(order) {

    const modal =
        document.getElementById(
            "successModal"
        );


    if (!modal) return;


    const orderIdElement =
        document.getElementById(
            "successOrderId"
        );


    const tableElement =
        document.getElementById(
            "successTable"
        );


    const timeElement =
        document.getElementById(
            "successTime"
        );


    const itemsElement =
        document.getElementById(
            "successOrderItems"
        );


    const totalElement =
        document.getElementById(
            "successOrderTotal"
        );


    // CUSTOMER NAME
    // Order ID is NOT shown to customer.

    if (orderIdElement) {

        orderIdElement.textContent =
            order.customerName;

    }


    // TABLE

    if (tableElement) {

        tableElement.textContent =
            order.table;

    }


    // ESTIMATED TIME

    if (timeElement) {

        timeElement.textContent =
            order.estimatedTime +
            " min";

    }


    // TOTAL

    if (totalElement) {

        totalElement.textContent =
            order.total;

    }


    // ITEMS

    if (itemsElement) {

        if (
            Array.isArray(
                order.items
            )
        ) {

            itemsElement.innerHTML =
                order.items.map(
                    function (item) {

                        return `
                            <div class="success-item-row">

                                <span>
                                    ${escapeHTML(
                                        String(
                                            item.name
                                        )
                                    )}
                                </span>

                                <span>
                                    × ${Number(
                                        item.quantity || 1
                                    )}
                                </span>

                                <strong>
                                    ₹${Number(
                                        item.price || 0
                                    ) *
                                    Number(
                                        item.quantity || 1
                                    )}
                                </strong>

                            </div>
                        `;

                    }
                ).join("");

        }

    }


    modal.classList.remove("hidden");


    // SHOW STATUS

    modal.classList.remove("hidden");

}




// ======================================================
// CLOSE SUCCESS
// ======================================================

function closeSuccess() {

    const successModal =
        document.getElementById("successModal");

    const checkoutModal =
        document.getElementById("checkoutModal");

    if (successModal) {
        successModal.classList.add("hidden");
    }

    if (checkoutModal) {
        checkoutModal.classList.add("hidden");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
} 


// ==========================================
// MY ORDERS - COMPLETE NEW VERSION
// ==========================================


// ==========================================
// OPEN MY ORDERS
// ==========================================

async function openMyOrders() {

    const modal =
        document.getElementById("myOrdersModal");

    if (!modal) {

        console.error(
            "❌ My Orders modal not found"
        );

        return;
    }

    modal.classList.remove("hidden");

    await displayMyOrders();
}


// ==========================================
// CLOSE MY ORDERS
// ==========================================

function closeMyOrders() {

    const modal =
        document.getElementById("myOrdersModal");

    if (!modal) return;

    modal.classList.add("hidden");
}


// ==========================================
// GET SAVED CUSTOMER PHONE
// ==========================================

function getSavedCustomerPhone() {

    let phone = "";

    try {

        const phoneInput =
            document.getElementById(
                "customerPhone"
            );

        if (phoneInput) {

            phone =
                phoneInput.value.trim();

        }


        // If input is empty,
        // get phone from localStorage.

        if (!phone) {

            phone =
                localStorage.getItem(
                    "customerPhone"
                ) || "";

        }

    } catch (error) {

        console.error(
            "❌ Customer phone error:",
            error
        );

    }

    return String(phone).trim();
}


// ==========================================
// LOAD LOCAL ORDERS
// ==========================================

function loadLocalOrders() {

    try {

        const savedOrders =
            localStorage.getItem("orders");

        if (!savedOrders) {

            return [];

        }


        const parsedOrders =
            JSON.parse(savedOrders);


        if (!Array.isArray(parsedOrders)) {

            return [];

        }


        return parsedOrders.filter(
            function(order) {

                return (
                    order &&
                    order.id
                );

            }
        );

    } catch (error) {

        console.error(
            "❌ Local order loading error:",
            error
        );

        return [];

    }

}


// ==========================================
// DISPLAY MY ORDERS
// ==========================================

async function displayMyOrders() {

    const container =
        document.getElementById(
            "myOrdersList"
        );

    if (!container) {

        console.error(
            "❌ myOrdersList not found"
        );

        return;
    }


    // ==========================================
    // LOAD THIS DEVICE'S OWN ORDERS
    // (phone number no longer needed)
    // ==========================================

    let localOrders =
        loadLocalOrders();


    if (localOrders.length > 0) {

        sortOrdersNewestFirst(
            localOrders
        );

        renderMyOrders(
            localOrders,
            container
        );

    } else {

        container.innerHTML = `

            <div class="no-orders">

                <div class="no-orders-icon">
                    🛒
                </div>

                <h3>
                    No orders yet
                </h3>

                <p>
                    Your orders will appear here.
                </p>

            </div>

        `;

        return;
    }


    // ==========================================
    // THIS DEVICE'S ORDER IDs
    // ==========================================

    const localOrderIds =
        new Set(
            localOrders.map(function (order) {
                return String(order.id);
            })
        );


    // ==========================================
    // LOAD LIVE STATUS FROM FIREBASE
    // (only for orders this device placed)
    // ==========================================

    let firebaseOrders = [];


    try {

        const snapshot =
            await database
                .ref("pistaHouse/orders")
                .once("value");


        const data =
            snapshot.val();


        if (
            data &&
            typeof data === "object"
        ) {

            Object.values(data).forEach(
                function(order) {

                    if (!order || !order.id) return;

                    if (
                        localOrderIds.has(
                            String(order.id)
                        )
                    ) {

                        firebaseOrders.push(
                            order
                        );

                    }

                }
            );

        }

    } catch (error) {

        console.error(
            "❌ Firebase My Orders Error:",
            error
        );

        return;
    }


    // ==========================================
    // MERGE LOCAL + FIREBASE
    // ==========================================

    const orderMap = {};

    localOrders.forEach(
        function(order) {

            if (order && order.id) {

                orderMap[String(order.id)] = order;

            }

        }
    );

    firebaseOrders.forEach(
        function(order) {

            if (order && order.id) {

                orderMap[String(order.id)] = order;

            }

        }
    );

    const allCustomerOrders =
        Object.values(orderMap);

    sortOrdersNewestFirst(
        allCustomerOrders
    );

    saveCompleteOrderHistory(
        firebaseOrders
    );

    if (allCustomerOrders.length > 0) {

        renderMyOrders(
            allCustomerOrders,
            container
        );

    } else {

        container.innerHTML = `

            <div class="no-orders">

                <div class="no-orders-icon">
                    🛒
                </div>

                <h3>
                    No orders yet
                </h3>

                <p>
                    Your orders will appear here.
                </p>

            </div>

        `;

    }

}



// ==========================================
// SORT ORDERS
// ==========================================

function sortOrdersNewestFirst(
    orders
) {

    orders.sort(
        function(a, b) {

            const dateA =
                new Date(
                    a.createdAt || 0
                ).getTime();


            const dateB =
                new Date(
                    b.createdAt || 0
                ).getTime();


            return dateB - dateA;

        }
    );

}


// ==========================================
// SAVE COMPLETE ORDER HISTORY
// ==========================================

function saveCompleteOrderHistory(
    firebaseOrders
) {

    try {

        const existingOrders =
            loadLocalOrders();


        const orderMap = {};


        // ------------------------------------------
        // KEEP ALL OLD LOCAL ORDERS
        // ------------------------------------------

        existingOrders.forEach(
            function(order) {

                if (
                    order &&
                    order.id
                ) {

                    orderMap[
                        String(order.id)
                    ] = order;

                }

            }
        );


        // ------------------------------------------
        // ADD NEW FIREBASE ORDERS
        // ------------------------------------------

        firebaseOrders.forEach(
            function(order) {

                if (
                    order &&
                    order.id
                ) {

                    orderMap[
                        String(order.id)
                    ] = order;

                }

            }
        );


        // ------------------------------------------
        // CREATE COMPLETE HISTORY
        // ------------------------------------------

        const completeHistory =
            Object.values(orderMap);


        sortOrdersNewestFirst(
            completeHistory
        );


        // ------------------------------------------
        // SAVE ALL ORDERS
        // ------------------------------------------

        localStorage.setItem(
            "orders",
            JSON.stringify(
                completeHistory
            )
        );


        console.log(
            "✅ Complete order history saved:",
            completeHistory.length
        );


    } catch (error) {

        console.error(
            "❌ Order history save error:",
            error
        );

    }

}


// ==========================================
// RENDER MY ORDERS
// ==========================================

function renderMyOrders(
    orders,
    container
) {

    if (
        !Array.isArray(orders) ||
        orders.length === 0
    ) {

        container.innerHTML = `

            <div class="no-orders">

                <div class="no-orders-icon">
                    🛒
                </div>

                <h3>
                    No orders yet
                </h3>

                <p>
                    Your orders will appear here.
                </p>

            </div>

        `;

        return;

    }


    // ==========================================
    // NEWEST ORDER FIRST
    // ==========================================

    sortOrdersNewestFirst(
        orders
    );


    // ==========================================
    // CREATE ORDER CARDS
    // ==========================================

    container.innerHTML =
        orders.map(
            function(order) {

                const name =
                    order.customerName ||
                    "Customer";


                const table =
                    order.table ||
                    "-";


                const status =
                    order.status ||
                    "Received";


                const total =
                    Number(
                        order.total || 0
                    );


                let itemsHTML = "";


                // ==================================
                // FOOD ITEMS
                // ==================================

                if (
                    Array.isArray(
                        order.items
                    ) &&
                    order.items.length > 0
                ) {

                    itemsHTML =
                        order.items.map(
                            function(item) {

                                const itemName =
                                    item.name ||
                                    "Food";


                                const quantity =
                                    Number(
                                        item.quantity ||
                                        1
                                    );


                                const price =
                                    Number(
                                        item.price ||
                                        0
                                    );


                                const itemTotal =
                                    price *
                                    quantity;


                                return `

                                    <div class="my-order-item">

                                        <span>
                                            ${escapeHTML(
                                                String(
                                                    itemName
                                                )
                                            )}
                                        </span>

                                        <span>
                                            × ${quantity}
                                        </span>

                                        <strong>
                                            ₹${itemTotal}
                                        </strong>

                                    </div>

                                `;

                            }
                        ).join("");

                }


                // ==================================
                // ORDER DATE
                // ==================================

                let orderDate = "";

                if (
                    order.createdAt
                ) {

                    try {

                        const date =
                            new Date(
                                order.createdAt
                            );


                        orderDate =
                            date.toLocaleString(
                                "en-IN",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }
                            );

                    } catch (error) {

                        orderDate = "";

                    }

                }


                // ==================================
                // ORDER CARD
                // ==================================

                return `

                    <div class="my-order-card">

                        <div class="my-order-header">

                            <div class="my-order-name">

                                📦
                                ${escapeHTML(
                                    String(name)
                                )}'s Order

                            </div>

                            <div class="my-order-status">

                                ${escapeHTML(
                                    String(status)
                                )}

                            </div>

                        </div>


                        <div class="my-order-table">

                            🪑 Table:

                            <strong>

                                ${escapeHTML(
                                    String(table)
                                )}

                            </strong>

                        </div>


                        ${
                            orderDate
                                ? `
                                    <div class="my-order-date">

                                        🕐
                                        ${escapeHTML(
                                            orderDate
                                        )}

                                    </div>
                                `
                                : ""
                        }


                        <div class="my-order-items">

                            ${itemsHTML}

                        </div>


                        <div class="my-order-total">

                            <span>
                                Total
                            </span>

                            <strong>
                                ₹${total}
                            </strong>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


// ==========================================
// DELETE ORDER HISTORY
// ==========================================

function deleteOrderHistory() {

    const savedOrders =
        localStorage.getItem("orders");


    if (!savedOrders) {

        alert(
            "No order history to delete."
        );

        return;

    }


    const confirmDelete =
        confirm(
            "Delete all your order history?"
        );


    if (!confirmDelete) {

        return;

    }


    // Delete local history

    localStorage.removeItem(
        "orders"
    );


    localStorage.removeItem(
        "currentOrderId"
    );


    // Reset current order

    if (
        typeof currentOrderId !==
        "undefined"
    ) {

        currentOrderId = null;

    }


    // Refresh My Orders

    displayMyOrders();


    alert(
        "Order history deleted successfully! ✅"
    );

}


// ==========================================
// MY ORDERS BUTTON EVENTS
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const closeButton =
            document.getElementById(
                "closeMyOrdersButton"
            );


        const deleteButton =
            document.getElementById(
                "deleteHistoryButton"
            );


        // Close button

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeMyOrders
            );

        }


        // Delete button

        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                deleteOrderHistory
            );

        }

    }
);

// =============================
// LOCK BACKGROUND WHEN MODAL OPENS
// =============================

function lockBackground() {
    document.body.classList.add("modal-open");
}

function unlockBackground() {
    document.body.classList.remove("modal-open");
}

function closeCheckout() {

    const modal =
        document.getElementById("checkoutModal");

    if (!modal) return;

    modal.classList.add("hidden");
}

function callRestaurant() {

    const phoneNumber = "+919966228888";

    window.open(
        "tel:" + phoneNumber,
        "_self"
    );

}

  // ==========================================
// LIVE ORDER STATUS NOTIFICATIONS
// (Admin status change -> Customer notification)
// ==========================================

function showOrderStatusToast(message) {

    let toast = document.getElementById("orderStatusToast");

    if (!toast) {

        toast = document.createElement("div");
        toast.id = "orderStatusToast";
        toast.style.position = "fixed";
        toast.style.bottom = "24px";
        toast.style.left = "50%";
        toast.style.transform = "translateX(-50%)";
        toast.style.background = "#1a5632";
        toast.style.color = "#fff";
        toast.style.padding = "14px 22px";
        toast.style.borderRadius = "10px";
        toast.style.fontSize = "15px";
        toast.style.fontWeight = "600";
        toast.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)";
        toast.style.zIndex = "9999";
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s ease";
        toast.style.textAlign = "center";
        toast.style.maxWidth = "85%";
        document.body.appendChild(toast);

    }

    toast.textContent = message;
    toast.style.opacity = "1";

    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(function () {
        toast.style.opacity = "0";
    }, 4000);

}

function startOrderStatusListener() {

    try {

        database.ref("pistaHouse/orders").on("value", function (snapshot) {

            const data = snapshot.val();

            if (!data || typeof data !== "object") return;

            let localOrders = loadLocalOrders();

            if (!localOrders.length) return;

            let changed = false;

            localOrders = localOrders.map(function (localOrder) {

                const liveOrder = data[localOrder.id];

                if (
                    liveOrder &&
                    liveOrder.status &&
                    liveOrder.status !== localOrder.status
                ) {

                    showOrderStatusToast(
                        "📦 Your order is now: " + liveOrder.status
                    );

                  showDeviceNotification(
                        "Pista House Ballari",
                        "Your order is now: " + liveOrder.status
                    );

                    changed = true;

                    return Object.assign(
                        {},
                        localOrder,
                        { status: liveOrder.status }
                    );

                }

                return localOrder;

            });

            if (changed) {

                try {

                    localStorage.setItem(
                        "orders",
                        JSON.stringify(localOrders)
                    );

                } catch (error) {

                    console.error(
                        "❌ Order status cache update error:",
                        error
                    );

                }

                const modal =
                    document.getElementById("myOrdersModal");

                if (
                    modal &&
                    !modal.classList.contains("hidden")
                ) {

                    displayMyOrders();

                }

            }

        });

    } catch (error) {

        console.error(
            "❌ Order Status Listener Error:",
            error
        );

    }

}

  // ==========================================
// SYSTEM (DEVICE) NOTIFICATION PERMISSION
// ==========================================

function requestNotificationPermission() {

  function showNotificationPromptButton() {

    try {

        if (!("Notification" in window)) return;

        if (Notification.permission !== "default") return;

        if (document.getElementById("notifyPromptBtn")) return;

        const btn = document.createElement("button");
        btn.id = "notifyPromptBtn";
        btn.textContent = "🔔 Get order updates on your phone";
        btn.style.position = "fixed";
        btn.style.bottom = "20px";
        btn.style.left = "50%";
        btn.style.transform = "translateX(-50%)";
        btn.style.background = "#1a5632";
        btn.style.color = "#fff";
        btn.style.border = "none";
        btn.style.padding = "12px 20px";
        btn.style.borderRadius = "30px";
        btn.style.fontSize = "14px";
        btn.style.fontWeight = "600";
        btn.style.boxShadow = "0 4px 14px rgba(0,0,0,0.3)";
        btn.style.zIndex = "9998";

        btn.onclick = function () {

            Notification.requestPermission().then(function () {
                btn.remove();
            });

        };

        document.body.appendChild(btn);

    } catch (error) {

        console.error(
            "❌ Notification Prompt Button Error:",
            error
        );

    }

  }
  
    try {

        if (!("Notification" in window)) {

            console.warn("⚠️ This browser does not support notifications.");
            return;
        }

        if (Notification.permission === "default") {

    showNotificationPromptButton();

        }

    } catch (error) {

        console.error(
            "❌ Notification Permission Error:",
            error
        );

    }

}


// ==========================================
// SHOW DEVICE NOTIFICATION
// ==========================================

function showDeviceNotification(title, body) {

    try {

        if (
            !("Notification" in window) ||
            Notification.permission !== "granted"
        ) {

            return;
        }

        const notification = new Notification(title, {
            body: body,
            icon: "logo.png",
            badge: "logo.png",
            tag: "pista-house-order-status",
            renotify: true
        });

        notification.onclick = function () {
            window.focus();
            notification.close();
        };

    } catch (error) {

        console.error(
            "❌ Device Notification Error:",
            error
        );

    }

}