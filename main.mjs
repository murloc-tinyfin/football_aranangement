import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

// ✅ Get Firebase instance from window (which was set in index.html)
const db = window.db || getDatabase();

// ✅ Ensure Firebase is initialized before using it
if (!window.db) {
    console.error("Firebase Database is not initialized! Check index.html.");
}




// ✅ Function to calculate and display the next Saturday (Keep this at the top)
function getNextSaturdayLocal() {
    listenForDateChanges(); // Listen for admin updates first
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


function setAdminDate(newDate) {
    const dateRef = ref(db, "eventDate");
    set(dateRef, newDate)
        .then(() => console.log("✅ Date updated in Firebase:", newDate))
        .catch(error => console.error("❌ Error updating date:", error));
}

function listenForDateChanges() {
    const dateRef = ref(db, "eventDate");
    onValue(dateRef, (snapshot) => {
        let newDate = snapshot.val();
        if (newDate) {
            document.getElementById("nextSaturday").innerHTML = `Next Event: ${newDate} <br> 下一个日期: ${newDate}`;
        } else {
            getNextSaturdayLocal();
        }
    });
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
        const signInModal = document.getElementById("signInModal");
        const nameInput = document.getElementById("nameInput");
        const submitName = document.getElementById("submitName");

        updateUI(); // Ensure UI updates on load

        signUpButton.addEventListener("click", () => {
            if (localStorage.getItem("currentUser")) {
                removeUserFromLists().then(() => {
                    localStorage.removeItem("currentUser");
                    updateUI(true); // Reset UI after sign-out
                }).catch(error => console.error("❌ Error signing out:", error));
            } else {
                signInModal.style.display = "block"; // Show the input box
            }
        });

        submitName.addEventListener("click", () => {
            const userName = nameInput.value.trim();
            if (userName) {
                localStorage.setItem("currentUser", userName);
                updateUI();
                signInModal.style.visibility = "hidden"; // Hide input box
                nameInput.value = ""; // Clear input
            } else {
                alert("Name cannot be empty! 名字不能为空");
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
    // Get or create Admin Login Button
    let adminButton = document.getElementById("adminLoginButton");
    if (!adminButton) {
        adminButton = document.createElement("button");
        adminButton.id = "adminLoginButton";
        adminButton.innerText = localStorage.getItem("isAdmin") ? "Admin Logged In" : "Admin Login";
        adminButton.classList.add("auth-button");
        document.body.appendChild(adminButton);
    }

    // Event Listener for Admin Login Button
    adminButton.addEventListener("click", () => {
        let password = prompt("Enter admin password:");
        if (password === null) return; // User canceled input

        if (password === "testpassword123") { // Change this to your actual admin password
            localStorage.setItem("isAdmin", "true");
            alert("Admin access granted.");
            adminButton.innerText = "Admin Logged In";
            enableDateChange(); // Enable date change function
        } else {
            alert("Incorrect password.");
        }
    });

    // ✅ If already logged in, enable the date change function on page load
    if (localStorage.getItem("isAdmin") === "true") {
        enableDateChange();
    }
}

// ✅ Function to get the global date from Firebase
function loadGlobalDate() {
    const dateRef = ref(db, "globalDate");
    get(dateRef).then(snapshot => {
        let savedDate = snapshot.val();
        if (savedDate) {
            document.getElementById("nextSaturday").innerHTML = `Next Saturday: ${savedDate} <br> 下一个周六: ${savedDate}`;
        } else {
            setNextSaturdayInFirebase(); // Initialize if missing
        }
    });
}

function setNextSaturdayInFirebase() {
    let nextSaturday = getNextSaturday();
    set(ref(db, "globalDate"), nextSaturday)
        .then(() => {
            console.log("✅ Next Saturday date set globally:", nextSaturday);
            document.getElementById("nextSaturday").innerHTML = `Next Saturday: ${nextSaturday} <br> 下一个周六: ${nextSaturday}`;
        })
        .catch(error => console.error("❌ Error setting global date:", error));
}

// ✅ Function to automatically set next Saturday and reset teams
function checkAndResetDate() {
    const dateRef = ref(db, "globalDate");
    get(dateRef).then(snapshot => {
        let savedDate = snapshot.val();
        let currentDate = new Date();
        let today = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;

        // If no date is set or the saved date has passed, reset it
        if (!savedDate || today >= savedDate) {
            setNextSaturdayInFirebase();
            resetTeams();
        }
    });
}

// ✅ Function to get the next Saturday's date
function getNextSaturday() {
    let currentDate = new Date();
    let daysUntilSaturday = (6 - currentDate.getDay() + 7) % 7 || 7;
    let nextSaturday = new Date(currentDate);
    nextSaturday.setDate(currentDate.getDate() + daysUntilSaturday);
    return `${nextSaturday.getFullYear()}/${String(nextSaturday.getMonth() + 1).padStart(2, '0')}/${String(nextSaturday.getDate()).padStart(2, '0')}`;
}


// ✅ Function to reset all teams
function resetTeams() {
    const teamsRef = ref(db, "teams");
    set(teamsRef, { list1: [], list2: [], list3: [] })
        .then(() => {
            console.log("✅ Teams have been reset globally!");
            alert("All teams have been cleared for the new date!");
            updateAllLists(); // Refresh UI
        })
        .catch(error => console.error("❌ Firebase reset error:", error));

    // ✅ Clear UI lists immediately
    document.getElementById("list1").innerHTML = "";
    document.getElementById("list2").innerHTML = "";
    document.getElementById("list3").innerHTML = "";
}
function enableDateChange() {
    let dateElement = document.getElementById("nextSaturday");
    if (!dateElement) {
        console.error("❌ Date element not found!");
        return;
    }

    // Add a button for changing the date (if not already present)
    let changeDateButton = document.getElementById("changeDateButton");
    if (!changeDateButton) {
        changeDateButton = document.createElement("button");
        changeDateButton.id = "changeDateButton";
        changeDateButton.innerText = "Change Date";
        changeDateButton.classList.add("auth-button");
        changeDateButton.style.marginTop = "10px";
        document.body.appendChild(changeDateButton);
    }

    // Event Listener for Changing the Date
    changeDateButton.addEventListener("click", () => {
        let newDate = prompt("Enter the new date (YYYY/MM/DD):");
        if (newDate) {
            let isValidDate = /^\d{4}\/\d{2}\/\d{2}$/.test(newDate);
            if (isValidDate) {
                set(ref(db, "globalDate"), newDate) // 🔹 Save to Firebase (Global)
                    .then(() => {
                        document.getElementById("nextSaturday").innerHTML = `Next Saturday: ${newDate} <br> 下一个周六: ${newDate}`;
                        resetTeams(); // ✅ Reset teams globally when date changes
                        alert("Date updated successfully for everyone!");
                    })
                    .catch(error => console.error("❌ Error updating global date:", error));
            } else {
                alert("Invalid date format. Use YYYY/MM/DD.");
            }
        }
    });

    // ✅ Load the current global date when enabling
    loadGlobalDate();
}

// ✅ Initialize Functions
handleSignUp();
setupButtonToggles();
getNextSaturdayLocal();
setupAdminLogin();
loadGlobalDate();
checkAndResetDate();
