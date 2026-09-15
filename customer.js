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
    checkCustomerOrderStatus();

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

function openCheckout() {

    if (
        !cart ||
        cart.length === 0
    ) {

        alert("Your cart is empty.");
        return;

    }


    closeCart();


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


    // IMPORTANT:
    // Keep only latest 20 orders.
    // This prevents localStorage becoming huge.

    if (orders.length >= 20) {

        orders =
            orders.slice(-19);

    }


    orders.push(order);


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

    const modal =
        document.getElementById(
            "successModal"
        );

    if (!modal) return;

    modal.classList.add("hidden");
  
}                         


// ==========================================
// MY ORDERS
// ==========================================

function openMyOrders() {

    const modal = document.getElementById("myOrdersModal");

    if (!modal) {
        console.error("My Orders modal not found");
        return;
    }

    modal.classList.remove("hidden");

    displayMyOrders();
}


// ==========================================
// CLOSE MY ORDERS
// ==========================================

function closeMyOrders() {

    const modal = document.getElementById("myOrdersModal");

    if (!modal) return;

    modal.classList.add("hidden");
}


// ==========================================
// DISPLAY ORDER HISTORY
// ==========================================

function displayMyOrders() {

    const container = document.getElementById("myOrdersList");

    if (!container) return;

    let orders = [];

    try {

        const savedOrders =
            localStorage.getItem("orders");

        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }

    } catch (error) {

        console.error("Order history error:", error);

        orders = [];
    }


    if (!Array.isArray(orders) || orders.length === 0) {

        container.innerHTML = `
            <div class="no-orders">

                <div class="no-orders-icon">
                    🛒
                </div>

                <h3>No orders yet</h3>

                <p>
                    Your orders will appear here.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML = orders
        .slice()
        .reverse()
        .map(function(order) {

            const name =
                order.customerName || "Customer";

            const table =
                order.table || "-";

            const status =
                order.status || "Received";

            const total =
                Number(order.total || 0);


            let itemsHTML = "";


            if (
                Array.isArray(order.items) &&
                order.items.length > 0
            ) {

                itemsHTML = order.items
                    .map(function(item) {

                        const itemName =
                            item.name || "Food";

                        const quantity =
                            Number(item.quantity || 1);

                        const price =
                            Number(item.price || 0);

                        return `
                            <div class="my-order-item">

                                <span>
                                    ${itemName}
                                </span>

                                <span>
                                    × ${quantity}
                                </span>

                                <strong>
                                    ₹${price * quantity}
                                </strong>

                            </div>
                        `;

                    })
                    .join("");

            }


            return `

                <div class="my-order-card">

                    <div class="my-order-header">

                        <div class="my-order-name">
                            📦 ${name}'s Order
                        </div>

                        <div class="my-order-status">
                            ${status}
                        </div>

                    </div>


                    <div class="my-order-table">
                        🪑 Table: <strong>${table}</strong>
                    </div>


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

        })
        .join("");
}


// ==========================================
// DELETE ORDER HISTORY
// ==========================================

function deleteOrderHistory() {

    const savedOrders =
        localStorage.getItem("orders");


    if (!savedOrders) {

        alert("No order history to delete.");

        return;
    }


    const confirmDelete =
        confirm(
            "Delete all your order history?"
        );


    if (!confirmDelete) {
        return;
    }


    localStorage.removeItem("orders");

    localStorage.removeItem("currentOrderId");


    if (typeof currentOrderId !== "undefined") {
        currentOrderId = null;
    }


    displayMyOrders();


    alert(
        "Order history deleted successfully! ✅"
    );
}

// ==========================================
// MY ORDERS BUTTON EVENTS
// ==========================================

document.addEventListener("DOMContentLoaded", function() {

    const closeButton =
        document.getElementById(
            "closeMyOrdersButton"
        );

    const deleteButton =
        document.getElementById(
            "deleteHistoryButton"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeMyOrders
        );

    }


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            deleteOrderHistory
        );

    }

});

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