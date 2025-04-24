import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

// ✅ Get Firebase instance from window (which was set in index.html)
const db = window.db || getDatabase();

// ✅ Ensure Firebase is initialized before using it
if (!window.db) {
    console.error("Firebase Database is not initialized! Check index.html.");
}


/*

// ✅ Function to calculate and display the next activity (Keep this at the top)
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
        element.innerHTML = `Next Event: ${formattedDate} <br> 下一次活动: ${formattedDate}`;
    }
}

*/
function setAdminDate(newDate) {
    const dateRef = ref(db, "eventDate");
    set(dateRef, newDate)
        .then(() => console.log("✅ Date updated in Firebase:", newDate))
        .catch(error => console.error("❌ Error updating date:", error));
}

function listenForDateChanges() {
    const dateRef = ref(db, "globalDate");

    onValue(dateRef, (snapshot) => {
        let storedDate = snapshot.val();
        if (storedDate) {
            document.getElementById("nextSaturday").innerHTML = `Next Event: ${storedDate} <br> 下一次活动: ${storedDate}`;
            checkAndResetDate(); // ✅ Check if reset is needed every time the date updates
        }
    });
}

function updatePlayerStats(playerName, statType) {
    if (localStorage.getItem("isAdmin") !== "true") {
        alert("Only admins can update player stats");
        return;
    }
    
    const statsRef = ref(db, "playerStats");
    
    get(statsRef).then(snapshot => {
        let playerStats = snapshot.val() || {};
        
        // Initialize player stats if not exists
        if (!playerStats[playerName]) {
            playerStats[playerName] = { stat1: 0, stat2: 0 };
        }
        
        // Increment the specified stat
        playerStats[playerName][statType]++;
        
        // Save to Firebase
        set(statsRef, playerStats)
            .then(() => {
                console.log(`✅ Incremented ${statType} for ${playerName}`);
                // No need to manually update UI here as we have real-time listeners
            })
            .catch(error => console.error(`❌ Error updating ${statType}:`, error));
    }).catch(error => console.error("❌ Error reading player stats:", error));
}

// ✅ Function to update all lists (Place this above `handleSignUp()`)
function updateAllLists() {
    const teamsRef = ref(db, "teams");
    const statsRef = ref(db, "playerStats");

    // Listen for real-time updates to player stats
    onValue(statsRef, (statsSnapshot) => {
        const playerStats = statsSnapshot.val() || {};
        
        // Listen for real-time updates to teams
        onValue(teamsRef, (teamsSnapshot) => {
            let userLists = teamsSnapshot.val() || {}; // Ensure we always get an object

            // Ensure lists always exist to prevent "undefined.map" error
            userLists.list1 = userLists.list1 || [];
            userLists.list2 = userLists.list2 || [];
            userLists.list3 = userLists.list3 || [];

            ["list1", "list2", "list3"].forEach(listId => {
                const listElement = document.getElementById(listId);
                if (listElement) {
                    listElement.innerHTML = userLists[listId]
                        .map(name => {
                            // Get player stats (default to 0 if not found)
                            const stats = playerStats[name] || { stat1: 0, stat2: 0 };
                            
                            // Create the list item with stats buttons and reset button
                            return `
                                <li>
                                    <span class="player-name">${name}</span>
                                    <span class="stat-buttons">
                                        <button class="stat-button" 
                                                data-player="${name}" 
                                                data-stat="stat1" 
                                                title="Click to increment (admin only)">
                                            ${stats.stat1}
                                        </button>
                                        <button class="stat-button" 
                                                data-player="${name}" 
                                                data-stat="stat2" 
                                                title="Click to increment (admin only)">
                                            ${stats.stat2}
                                        </button>
                                        <button class="reset-button" 
                                                data-player="${name}" 
                                                title="Reset stats to zero (admin only)">
                                            ↺
                                        </button>
                                    </span>
                                </li>`;
                        })
                        .join(""); // Render the list
                        
                    // Add event listeners after rendering
                    addStatButtonListeners(listElement);
                    addResetButtonListeners(listElement);
                }
            });
        });
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

        if (password === "test123") { // Change this to your actual admin password
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
            document.getElementById("nextSaturday").innerHTML = `next activity: ${savedDate} <br> 下一次活动: ${savedDate}`;
        } else {
            setNextSaturdayInFirebase(); // Initialize if missing
        }
    });
}

function setNextSaturdayInFirebase() {
    let nextSaturday = getNextSaturday();
    set(ref(db, "globalDate"), nextSaturday)
        .then(() => {
            console.log("✅ next activity date set globally:", nextSaturday);
            document.getElementById("nextSaturday").innerHTML = `next activity: ${nextSaturday} <br> 下一次活动: ${nextSaturday}`;
        })
        .catch(error => console.error("❌ Error setting global date:", error));
}

function formatDate(date, useMMDD = false) {
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    let year = date.getFullYear();

    return useMMDD ? `${month}${day}` : `${year}/${month}/${day}`;
}




function checkAndResetDate() {
    get(ref(db, "globalDate")).then(snapshot => {
        let storedDate = snapshot.val();
        if (!storedDate) return;

        let today = new Date();
        let todayStr = formatDate(today); // Format to YYYY/MM/DD

        let storedDateObj = new Date(storedDate);
        storedDateObj.setDate(storedDateObj.getDate() + 1); // Ensure reset happens the day after

        let storedDatePlusOneStr = formatDate(storedDateObj);

        console.log(`🔍 Checking reset: Today = ${todayStr}, Stored+1 = ${storedDatePlusOneStr}`);

        if (todayStr >= storedDatePlusOneStr) {
            console.log("✅ Resetting teams and updating date...");
            resetTeams(); // Clear team lists
            let nextSaturday = getNextSaturday();
            set(ref(db, "globalDate"), nextSaturday)
                .then(() => {
                    document.getElementById("nextSaturday").innerHTML = `next activity: ${nextSaturday} <br> 下一次活动: ${nextSaturday}`;
                    console.log("✅ Global date updated to next activity.");
                })
                .catch(error => console.error("❌ Error updating global date:", error));
        }
    });
}




// ✅ Function to get the next activity's date
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

    let changeDateButton = document.getElementById("changeDateButton");
    if (!changeDateButton) {
        changeDateButton = document.createElement("button");
        changeDateButton.id = "changeDateButton";
        changeDateButton.innerText = "Change Date";
        changeDateButton.classList.add("auth-button");
        changeDateButton.style.marginTop = "10px";
        document.body.appendChild(changeDateButton);
    }

    changeDateButton.addEventListener("click", () => {
        let newDateMMDD = prompt("Enter the new date (MMDD):");
        if (!newDateMMDD || !/^\d{4}$/.test(newDateMMDD)) {
            alert("Invalid format. Use MMDD (e.g., 0323 for March 23).");
            return;
        }

        let today = new Date();
        let year = today.getFullYear();
        let month = parseInt(newDateMMDD.substring(0, 2), 10) - 1;
        let day = parseInt(newDateMMDD.substring(2, 4), 10);

        let newDate = new Date(year, month, day);
        let formattedDate = formatDate(newDate); // Convert to YYYY/MM/DD

        set(ref(db, "globalDate"), formattedDate)
            .then(() => {
                document.getElementById("nextSaturday").innerHTML = `next activity: ${formattedDate} <br> 下一次活动: ${formattedDate}`;
                alert("Date updated successfully!");
            })
            .catch(error => console.error("❌ Error updating global date:", error));
    });

    loadGlobalDate();
}

function addStatButtonListeners(listElement) {
    const buttons = listElement.querySelectorAll('.stat-button');
    
    buttons.forEach(button => {
        // Remove any existing listeners to avoid duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add new click listener
        newButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            const playerName = this.dataset.player;
            const statType = this.dataset.stat;
            updatePlayerStats(playerName, statType);
        });
    });
}

// Add this function to include player stats reset in the team reset function
function modifyResetTeamsFunction() {
    // Store reference to original function
    const originalResetTeams = resetTeams;
    
    // Redefine resetTeams with additional stats reset functionality
    resetTeams = function() {
        const teamsRef = ref(db, "teams");
        set(teamsRef, { list1: [], list2: [], list3: [] })
            .then(() => {
                console.log("✅ Teams have been reset globally!");
                
                // Ask about resetting player stats
                const resetStats = confirm("Do you want to reset player stats as well?");
                if (resetStats) {
                    set(ref(db, "playerStats"), {})
                        .then(() => console.log("✅ Player stats have been reset!"))
                        .catch(error => console.error("❌ Error resetting stats:", error));
                }
                
                alert("All teams have been cleared for the new date!");
                updateAllLists(); // Refresh UI
            })
            .catch(error => console.error("❌ Firebase reset error:", error));

        // Clear UI lists immediately
        document.getElementById("list1").innerHTML = "";
        document.getElementById("list2").innerHTML = "";
        document.getElementById("list3").innerHTML = "";
    };
}

// Add a new function to handle reset button clicks
function addResetButtonListeners(listElement) {
    const resetButtons = listElement.querySelectorAll('.reset-button');
    
    resetButtons.forEach(button => {
        // Remove any existing listeners to avoid duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add new click listener
        newButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            const playerName = this.dataset.player;
            
            // Check admin permissions
            if (localStorage.getItem("isAdmin") !== "true") {
                alert("Only admins can reset player stats");
                return;
            }
            
            // Confirm before resetting
            if (confirm(`Reset all stats for ${playerName} to zero?`)) {
                resetPlayerStats(playerName);
            }
        });
    });
}

function resetPlayerStats(playerName) {
    const statsRef = ref(db, "playerStats");
    
    get(statsRef).then(snapshot => {
        let playerStats = snapshot.val() || {};
        
        // Set both stats to zero
        if (playerStats[playerName]) {
            playerStats[playerName] = { stat1: 0, stat2: 0 };
            
            // Save to Firebase
            set(statsRef, playerStats)
                .then(() => {
                    console.log(`✅ Reset stats for ${playerName}`);
                    // No need to manually update UI here as we have real-time listeners
                })
                .catch(error => console.error(`❌ Error resetting stats:`, error));
        }
    }).catch(error => console.error("❌ Error reading player stats:", error));
}

setInterval(() => {checkAndResetDate(); }, 60000);


// ✅ Initialize Functions
handleSignUp();
setupButtonToggles();
setupAdminLogin();
loadGlobalDate();
checkAndResetDate();
listenForDateChanges();
modifyResetTeamsFunction();
