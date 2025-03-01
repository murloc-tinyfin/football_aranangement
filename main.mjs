import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

// ✅ Get Firebase instance from window (which was set in index.html)
const db = window.db || getDatabase();

// ✅ Ensure Firebase is initialized before using it
if (!window.db) {
    console.error("Firebase Database is not initialized! Check index.html.");
}




// ✅ Function to calculate and display the next Saturday (Keep this at the top)
function getNextSaturdayLocal() {
    let currentDate = new Date();
    let daysUntilSaturday = (6 - currentDate.getDay() + 7) % 7 || 7;
    let nextSaturday = new Date(currentDate);
    nextSaturday.setDate(currentDate.getDate() + daysUntilSaturday);

    let formattedDate = `${nextSaturday.getFullYear()}/${
        String(nextSaturday.getMonth() + 1).padStart(2, '0')}/${
        String(nextSaturday.getDate()).padStart(2, '0')}`;

    const element = document.getElementById("nextSaturday");
    if (element) {
        element.innerHTML = `Next Saturday: ${formattedDate} <br> 下一个周六: ${formattedDate}`;
    }
}

// ✅ Call it when the page loads
document.addEventListener("DOMContentLoaded", getNextSaturdayLocal);


// ✅ Function to update all lists (Place this above `handleSignUp()`)
function updateAllLists() {
    const teamsRef = ref(db, "teams");

    onValue(teamsRef, (snapshot) => {
        let userLists = snapshot.val() || {}; // Ensure we always get an object

        // ✅ Ensure lists always exist to prevent "undefined.map" error
        userLists.list1 = userLists.list1 || [];
        userLists.list2 = userLists.list2 || [];
        userLists.list3 = userLists.list3 || [];

        ["list1", "list2", "list3"].forEach(listId => {
            const listElement = document.getElementById(listId);
            if (listElement) {
                listElement.innerHTML = userLists[listId]
                    .map(name => `<li>${name}</li>`)
                    .join(""); // Render the list
            }
        });
    }, {
        onlyOnce: false // Keep real-time updates
    });
}

function removeUserFromLists() {
    return new Promise((resolve, reject) => {
        const currentUser = localStorage.getItem("currentUser");
        if (!currentUser) return resolve(); // No user logged in

        get(ref(db, "teams")).then(snapshot => {
            let teams = snapshot.val() || { list1: [], list2: [], list3: [] };

            // ✅ Remove user from all teams
            Object.keys(teams).forEach(key => {
                teams[key] = teams[key].filter(name => name !== currentUser);
            });

            // ✅ Update Firebase
            set(ref(db, "teams"), teams)
                .then(() => {
                    console.log(`✅ User ${currentUser} removed from all teams`);
                    resolve();
                })
                .catch(error => {
                    console.error("❌ Firebase write error:", error);
                    reject(error);
                });
        }).catch(error => {
            console.error("❌ Firebase read error:", error);
            reject(error);
        });
    });
}


// ✅ Function to handle sign-ups and show buttons (Keep this in the same place)
function handleSignUp() {
    document.addEventListener("DOMContentLoaded", () => {
        const signUpButton = document.getElementById("signUpButton");

        // ✅ Run UI update on load to fix glitches
        updateUI();

        // ✅ Remove old event listeners before adding a new one
        signUpButton.replaceWith(signUpButton.cloneNode(true));
        const newSignUpButton = document.getElementById("signUpButton");

        newSignUpButton.addEventListener("click", () => {
            if (localStorage.getItem("currentUser")) {
                // ✅ User is signing out
                removeUserFromLists().then(() => {
                    localStorage.removeItem("currentUser");
                    updateUI(true); // Reset UI after sign-out
                }).catch(error => console.error("❌ Error signing out:", error));
            } else {
                // ✅ User is signing in
                const userName = prompt("Enter your name 输入你的名字").trim();
                if (userName) {
                    localStorage.setItem("currentUser", userName);
                    updateUI(); // Refresh UI after sign-in
                } else {
                    alert("Name cannot be empty! 名字不能为空"); // Prevent empty names
                }
            }
        });
    });
}



function updateUI(reset = false) {
    let currentUser = localStorage.getItem("currentUser");
    const buttonContainer = document.getElementById("buttonContainer");
    const welcomeMessage = document.getElementById("welcomeMessage");
    const signUpButton = document.getElementById("signUpButton");

    if (reset || !currentUser) {
        buttonContainer.style.visibility = "hidden"; /* Hide without shifting */
        document.getElementById("list1").innerHTML = "";
        document.getElementById("list2").innerHTML = "";
        document.getElementById("list3").innerHTML = "";
        welcomeMessage.innerHTML = "Welcome! Please sign in. 欢迎！请登录";
        signUpButton.innerHTML = "Sign In 登录";
    } else {
        buttonContainer.style.visibility = "visible"; /* Show while keeping layout */
        welcomeMessage.innerHTML = `Welcome, ${currentUser}! Choose a team. <br> 欢迎, ${currentUser}! 选择一个队伍.`;
        signUpButton.innerHTML = "Sign Out 登出";
        setupButtonToggles();
        updateAllLists();
    }
}






// ✅ Function to add the current user to a selected team (Place this before `setupButtonToggles()`)
function addUserToTeam(team) {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
        alert("Please sign in first.");
        return;
    }

    get(ref(db, "teams")).then(snapshot => {
        let teams = snapshot.val() || { list1: [], list2: [], list3: [] };

        // ✅ Ensure each team list exists
        ["list1", "list2", "list3"].forEach(list => {
            teams[list] = teams[list] || [];
        });

        // ✅ Check if user is already in the selected team
        let isAlreadyInTeam = teams[team]?.includes(currentUser);

        if (isAlreadyInTeam) {
            // ✅ Remove user from the selected team (toggle off)
            teams[team] = teams[team].filter(name => name !== currentUser);
            console.log(`✅ User ${currentUser} removed from ${team}`);
        } else {
            // ✅ Remove user from all teams first
            Object.keys(teams).forEach(key => {
                teams[key] = teams[key].filter(name => name !== currentUser);
            });

            // ✅ Add user to the selected team
            teams[team].push(currentUser);
            console.log(`✅ User ${currentUser} moved to ${team}`);
        }

        // ✅ Update Firebase database
        set(ref(db, "teams"), teams)
            .then(() => updateAllLists()) // Refresh UI
            .catch(error => console.error("❌ Firebase write error:", error));
    }).catch(error => console.error("❌ Firebase read error:", error));
}




// ✅ Function to handle button clicks (Keep this where `setupButtonToggles()` originally was)
function setupButtonToggles() {
    const buttons = [
        { buttonId: "btn1", listId: "list1" },
        { buttonId: "btn2", listId: "list2" },
        { buttonId: "btn3", listId: "list3" },
    ];

    buttons.forEach(({ buttonId, listId }) => {
        const button = document.getElementById(buttonId);
        if (button) {
            // ✅ Remove previous event listeners to avoid duplication
            button.replaceWith(button.cloneNode(true));
            const newButton = document.getElementById(buttonId);

            newButton.addEventListener("click", () => {
                console.log(`🔄 Button ${buttonId} clicked, selecting ${listId}`);
                addUserToTeam(listId);
            });
        } else {
            console.error(`❌ Button ${buttonId} not found!`);
        }
    });
}

function setupAdminLogin() {
    // Create Admin Login Button
    const adminButton = document.createElement("button");
    adminButton.id = "adminLoginButton";
    adminButton.innerText = localStorage.getItem("isAdmin") ? "Admin Logged In" : "Admin Login";
    adminButton.classList.add("auth-button"); // Apply same styling as Sign In button
    document.body.appendChild(adminButton);

    // Create Admin Password Input (Initially Hidden)
    const adminInput = document.createElement("input");
    adminInput.id = "adminPasswordInput";
    adminInput.type = "password";
    adminInput.placeholder = "Enter admin password";
    adminInput.style.visibility = "hidden";
    document.body.appendChild(adminInput);

    // Create Confirm Admin Login Button (Initially Hidden)
    const confirmAdminButton = document.createElement("button");
    confirmAdminButton.id = "confirmAdminButton";
    confirmAdminButton.innerText = "Confirm Admin Login";
    confirmAdminButton.classList.add("auth-button"); // Apply same styling
    confirmAdminButton.style.visibility = "hidden";
    document.body.appendChild(confirmAdminButton);

    // Event Listener for Admin Login Button
    adminButton.addEventListener("click", () => {
        if (localStorage.getItem("currentUser")) {
            adminInput.style.visibility = "visible";
            confirmAdminButton.style.visibility = "visible";
        } else {
            alert("You must log in normally first.");
        }
    });

    // Event Listener for Confirming Admin Login
    confirmAdminButton.addEventListener("click", () => {
        if (adminInput.value === "testpassword123") {
            localStorage.setItem("isAdmin", "true");
            alert("Admin access granted.");
            adminButton.innerText = "Admin Logged In"; // Update button text
            adminInput.style.visibility = "hidden";
            confirmAdminButton.style.visibility = "hidden";
        } else {
            alert("Incorrect password.");
        }
    });
}




// ✅ Initialize Functions
handleSignUp();
setupButtonToggles();
getNextSaturdayLocal();
setupAdminLogin();
