import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
    getAuth,
    signOut,
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    deleteDoc,
    updateDoc,
    query,
    where,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAEzF_cdKNAcWHTZaROgUUFUGxHLQXyINg",
    authDomain: "e-commerce-f6fd2.firebaseapp.com",
    projectId: "e-commerce-f6fd2",
    storageBucket: "e-commerce-f6fd2.firebasestorage.app",
    messagingSenderId: "747136831766",
    appId: "1:747136831766:web:f1ac91329c8d066c3a4037",
    measurementId: "G-DJJP76WVG7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ADMIN EMAIL (Replace with your admin email)
const ADMIN_EMAIL = "muhammad.abdan.2007@gmail.com";

// Signup Functionality
const sbtn = document.getElementById('sbtn');
if(sbtn) {
    sbtn.addEventListener('click', async() => {
        const email = document.getElementById('semail').value;
        const password = document.getElementById('spass').value;
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            Swal.fire({
                title: "SignUp Successful!",
                icon: "success",
                confirmButtonText: "Continue"
            }).then(() => {
                window.location.href = './dashboard.html';
            });
        } catch (error) {
            Swal.fire("Error", error.message, "error");
        }
    });
}

// Login Functionality
const lbtn = document.getElementById('lbtn');
if(lbtn) {
    lbtn.addEventListener('click', async() => {
        const email = document.getElementById('lemail').value;
        const password = document.getElementById('lpass').value;
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            Swal.fire({
                title: "Login Successful!",
                icon: "success",
                confirmButtonText: "Continue"
            }).then(() => {
                window.location.href = './dashboard.html';
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Login Failed",
                text: error.message,
            });
        }
    });
}

// Logout Functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            Swal.fire({
                title: "Logout Successful",
                icon: "success"
            }).then(() => {
                window.location.href = './login.html';
            });
        }).catch((error) => {
            console.error(error);
        });
    });
}

// Check auth state and load appropriate content
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User logged in:", user.email);
        
        // Show admin buttons if user is admin
        if (user.email === ADMIN_EMAIL) {
            const addProductBtn = document.getElementById('addProductBtn');
            if (addProductBtn) {
                addProductBtn.classList.remove('d-none');
            }
        }
        
        // Load products on dashboard
        if (window.location.pathname.includes('dashboard.html')) {
            loadProducts();
        }
        
        // Load cart items if on cart page
        if (window.location.pathname.includes('cart.html')) {
            loadCartItems();
        }
        
        // Update cart count in navbar
        updateCartCount();
    } else {
        console.log("User is signed out");
        
        // Redirect to login if not authenticated and on protected pages
        if (window.location.pathname.includes('dashboard.html') || 
            window.location.pathname.includes('cart.html')) {
            window.location.href = './login.html';
        }
    }
});

// PRODUCT MANAGEMENT FUNCTIONS
async function loadProducts() {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;
    
    productsContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        productsContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            productsContainer.innerHTML = '<div class="col-12 text-center py-5"><h5>No products found</h5></div>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const isAdmin = auth.currentUser?.email === ADMIN_EMAIL;
            
            const productCard = `
                <div class="col-md-4 mb-4" data-id="${doc.id}">
                    <div class="card h-100">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.description}</p>
                            <p class="fw-bold">$${product.price.toFixed(2)}</p>
                        </div>
                        <div class="card-footer bg-white d-flex justify-content-between">
                            <button class="btn btn-sm btn-primary add-to-cart-btn" data-id="${doc.id}">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                            ${isAdmin ? `
                            <div>
                                <button class="btn btn-sm btn-warning edit-product-btn" data-id="${doc.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-product-btn" data-id="${doc.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            productsContainer.insertAdjacentHTML('beforeend', productCard);
        });
        
        // Add event listeners for product buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', addToCart);
        });
        
        if (auth.currentUser?.email === ADMIN_EMAIL) {
            document.querySelectorAll('.edit-product-btn').forEach(btn => {
                btn.addEventListener('click', editProduct);
            });
            
            document.querySelectorAll('.delete-product-btn').forEach(btn => {
                btn.addEventListener('click', deleteProduct);
            });
        }
    } catch (error) {
        console.error("Error loading products:", error);
        productsContainer.innerHTML = '<div class="col-12 text-center py-5"><h5 class="text-danger">Error loading products</h5></div>';
    }
}

// Add to Cart Functionality
async function addToCart(e) {
    const productId = e.target.closest('button').dataset.id;
    const userId = auth.currentUser.uid;
    
    try {
        // Get product details
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
            throw new Error("Product not found");
        }
        
        const product = productSnap.data();
        
        // Check if product already in cart
        const cartItemRef = doc(db, "carts", `${userId}_${productId}`);
        const cartItemSnap = await getDoc(cartItemRef);
        
        if (cartItemSnap.exists()) {
            // Update quantity
            await updateDoc(cartItemRef, {
                quantity: cartItemSnap.data().quantity + 1
            });
        } else {
            // Add new item to cart
            await setDoc(cartItemRef, {
                productId,
                userId,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1

            });
        }
        
        // Show success message
        Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Added to cart!',
            showConfirmButton: false,
            timer: 1000
        });
        
        // Update cart count
        updateCartCount();
    } catch (error) {
        console.error("Error adding to cart:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Failed to add product to cart',
        });
    }
}

// Update cart count in navbar
async function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (!cartCount) return;
    
    const userId = auth.currentUser?.uid;
    if (!userId) {
        cartCount.textContent = '0';
        return;
    }
    
    try {
        const q = query(collection(db, "carts"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        let totalItems = 0;
        querySnapshot.forEach((doc) => {
            totalItems += doc.data().quantity;
        });
        
        cartCount.textContent = totalItems || '0';
    } catch (error) {
        console.error("Error updating cart count:", error);
        cartCount.textContent = '0';
    }
}

// Load cart items for cart page
async function loadCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItemsContainer) return;
    
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    try {
        cartItemsContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border" role="status"></div></div>';
        
        const q = query(collection(db, "carts"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            emptyCartMessage.classList.remove('d-none');
            cartItemsContainer.innerHTML = '';
            subtotalElement.textContent = '$0.00';
            taxElement.textContent = '$0.00';
            totalElement.textContent = '$0.00';
            checkoutBtn.disabled = true;
            return;
        }
        
        emptyCartMessage.classList.add('d-none');
        cartItemsContainer.innerHTML = '';
        
        let subtotal = 0;
        
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            subtotal += item.price * item.quantity;
            
            const cartItem = `
                <div class="row mb-3 align-items-center" data-id="${doc.id}">
                    <div class="col-md-2">
                        <img src="${item.image}" class="cart-img rounded" alt="${item.name}">
                    </div>
                    <div class="col-md-4">
                        <h6>${item.name}</h6>
                        <p class="mb-0">$${item.price.toFixed(2)}</p>
                    </div>
                    <div class="col-md-3">
                        <div class="d-flex align-items-center">
                            <button class="btn btn-outline-secondary quantity-btn decrease-quantity" data-id="${doc.id}">-</button>
                            <span class="mx-2">${item.quantity}</span>
                            <button class="btn btn-outline-secondary quantity-btn increase-quantity" data-id="${doc.id}">+</button>
                        </div>
                    </div>
                    <div class="col-md-2 text-end">
                        <p class="fw-bold mb-0">$${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div class="col-md-1 text-end">
                        <button class="btn btn-sm btn-outline-danger remove-item-btn" data-id="${doc.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <hr>
            `;
            
            cartItemsContainer.insertAdjacentHTML('beforeend', cartItem);
        });
        
        // Calculate totals after all items are processed
        const tax = subtotal * 0.10; // 10% tax
        const total = subtotal + tax;
        
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        taxElement.textContent = `$${tax.toFixed(2)}`;
        totalElement.textContent = `$${total.toFixed(2)}`;
        checkoutBtn.disabled = false;
        
        // Add event listeners for quantity buttons
        document.querySelectorAll('.decrease-quantity').forEach(btn => {
            btn.addEventListener('click', updateCartItemQuantity);
        });
        
        document.querySelectorAll('.increase-quantity').forEach(btn => {
            btn.addEventListener('click', updateCartItemQuantity);
        });
        
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', removeCartItem);
        });
    } catch (error) {
        console.error("Error loading cart items:", error);
        cartItemsContainer.innerHTML = `
            <div class="alert alert-danger">
                Error loading cart: ${error.message}
                <button class="btn btn-sm btn-warning mt-2" onclick="location.reload()">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Update cart item quantity
async function updateCartItemQuantity(e) {
    const button = e.target.closest('button');
    const cartItemId = button.dataset.id;
    const isIncrease = button.classList.contains('increase-quantity');
    
    try {
        const cartItemRef = doc(db, "carts", cartItemId);
        const cartItemSnap = await getDoc(cartItemRef);
        
        if (!cartItemSnap.exists()) {
            throw new Error("Cart item not found");
        }
        
        const currentQuantity = cartItemSnap.data().quantity;
        let newQuantity = isIncrease ? currentQuantity + 1 : currentQuantity - 1;
        
        if (newQuantity < 1) {
            // Remove item if quantity would be 0
            await deleteDoc(cartItemRef);
        } else {
            // Update quantity
            await updateDoc(cartItemRef, {
                quantity: newQuantity
            });
        }
        
        // Reload cart items
        await loadCartItems();
        await updateCartCount();
    } catch (error) {
        console.error("Error updating cart item:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: error.message || 'Failed to update cart item',
        });
    }
}

// Remove cart item
async function removeCartItem(e) {
    const cartItemId = e.target.closest('button').dataset.id;
    
    try {
        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });
        
        if (result.isConfirmed) {
            await deleteDoc(doc(db, "carts", cartItemId));
            
            await Swal.fire(
                'Deleted!',
                'Item has been removed from cart.',
                'success'
            );
            
            // Reload cart items
            await loadCartItems();
            await updateCartCount();
        }
    } catch (error) {
        console.error("Error removing cart item:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: error.message || 'Failed to remove item from cart',
        });
    }
}

// ADMIN PRODUCT MANAGEMENT FUNCTIONS

// Initialize product modal
const addProductBtn = document.getElementById('addProductBtn');
const saveProductBtn = document.getElementById('saveProductBtn');
const deleteProductBtn = document.getElementById('deleteProductBtn');
const addProductModal = document.getElementById('addProductModal');

if (addProductModal) {
    const modal = bootstrap.Modal.getOrCreateInstance(addProductModal);
    
    // Reset modal when hidden
    addProductModal.addEventListener('hidden.bs.modal', () => {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        deleteProductBtn.classList.add('d-none');
    });
    
    // Save product (add or update)
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', async () => {
            const name = document.getElementById('productName').value;
            const description = document.getElementById('productDescription').value;
            const price = parseFloat(document.getElementById('productPrice').value);
            const image = document.getElementById('productImage').value;
            const productId = document.getElementById('productId').value;
            
            if (!name || !description || isNaN(price) || !image) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Please fill all fields with valid data!',
                });
                return;
            }
            
            try {
                if (productId) {
                    // Update existing product
                    await updateDoc(doc(db, "products", productId), {
                        name,
                        description,
                        price,
                        image
                    });
                    
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'Product updated!',
                        showConfirmButton: false,
                        timer: 1000
                    });
                } else {
                    // Add new product
                    await addDoc(collection(db, "products"), {
                        name,
                        description,
                        price,
                        image
                    });
                    
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'Product added!',
                        showConfirmButton: false,
                        timer: 1000
                    });
                }
                
                // Clear the form fields
                document.getElementById('productForm').reset();
                document.getElementById('productId').value = '';
                
                modal.hide();
                loadProducts();
            } catch (error) {
                console.error("Error saving product:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Failed to save product',
                });
            }
        });
    }
}

// Edit product
async function editProduct(e) {
    const productId = e.target.closest('button').dataset.id;
    
    try {
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
            throw new Error("Product not found");
        }
        
        const product = productSnap.data();
        
        // Fill modal with product data
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productImage').value = product.image;
        document.getElementById('productId').value = productId;
        
        // Show delete button
        deleteProductBtn.classList.remove('d-none');
        
        // Show modal
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal'));
        modal.show();
    } catch (error) {
        console.error("Error editing product:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Failed to edit product',
        });
    }
}

// Delete product
async function deleteProduct(e) {
    const productId = e.target.closest('button').dataset.id;
    
    try {
        // First confirm deletion
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            // Delete product from products collection
            await deleteDoc(doc(db, "products", productId));

            // Also delete any cart items referencing this product
            const q = query(collection(db, "carts"), where("productId", "==", productId));
            const querySnapshot = await getDocs(q);
            
            const deletePromises = [];
            querySnapshot.forEach((cartItemDoc) => {
                deletePromises.push(deleteDoc(cartItemDoc.ref));
            });
            
            await Promise.all(deletePromises);

            Swal.fire(
                'Deleted!',
                'Product has been deleted.',
                'success'
            );

            // Reload products
            await loadProducts();
            await updateCartCount();
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: error.message || 'Failed to delete product',
        });
    }
}

