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
        element.textContent = `Next Saturday: ${formattedDate}\n下一个周六: ${formattedDate}`;
    }
}

// ✅ Call it when the page loads
document.addEventListener("DOMContentLoaded", getNextSaturdayLocal);


// ✅ Function to update all lists (Place this above `handleSignUp()`)
function updateAllLists() {
    const teamsRef = ref(db, "teams");

    onValue(teamsRef, (snapshot) => {
        const userLists = snapshot.val() || { list1: [], list2: [], list3: [] };

        ["list1", "list2", "list3"].forEach(listId => {
            const listElement = document.getElementById(listId);
            if (listElement) {
                listElement.innerHTML = userLists[listId].map(name => `<li>${name}</li>`).join("");
            }
        });
    });
}


// ✅ Function to handle sign-ups and show buttons (Keep this in the same place)
function handleSignUp() {
    document.addEventListener("DOMContentLoaded", () => {
        const signUpButton = document.getElementById("signUpButton");
        const welcomeMessage = document.getElementById("welcomeMessage");
        const buttonContainer = document.getElementById("buttonContainer");

        updateUI(); // Ensure UI updates when the page loads

        signUpButton.addEventListener("click", () => {
            if (localStorage.getItem("currentUser")) {
                // Sign out process
                removeUserFromLists(); // Remove user from all lists before signing out
                localStorage.removeItem("currentUser");
                updateUI(true); // Reset UI completely
            } else {
                // Sign up process
                const userName = prompt("Enter your name 输入你的名字").trim();
                if (userName) {
                    localStorage.setItem("currentUser", userName);
                    updateUI(); // Ensure UI refreshes after signing in
                } else {
                    alert("Name cannot be empty! 名字不能为空"); // Prevent empty names
                }
            }
        });

        function updateUI(reset = false) {
        let currentUser = localStorage.getItem("currentUser");
        const buttonContainer = document.getElementById("buttonContainer");

        if (reset || !currentUser) {
            // Hide lists when user is not signed in
            document.getElementById("list1").innerHTML = "";
            document.getElementById("list2").innerHTML = "";
            document.getElementById("list3").innerHTML = "";
            buttonContainer.style.display = "none"; // Hide buttons
            welcomeMessage.textContent = "Welcome! Please sign in. 欢迎！请登录";
            signUpButton.textContent = "Sign In 登录";
        } else {
            // Show buttons and allow team selection when signed in
            buttonContainer.style.display = "block";
            welcomeMessage.textContent = `Welcome, ${currentUser}! Choose a team to sign up to. 欢迎, ${currentUser}!选择一个队报名`;
            signUpButton.textContent = "Sign Out 登出";
            setupButtonToggles(); // Refresh buttons
            updateAllLists(); // Load team lists only after login
        }
    }

        });
    }

// ✅ Function to add the current user to a selected team (Place this before `setupButtonToggles()`)
function addUserToTeam(team) {
    const currentUser = localStorage.getItem("currentUser");
    
    if (!currentUser) {
        alert("Please sign in first.");
        return;
    }

    // Get the current team data from Firebase
    get(ref(db, "teams")).then(snapshot => {
        let teams = snapshot.val() || { list1: [], list2: [], list3: [] };

        // ✅ Remove user from all teams before adding them to a new one
        Object.keys(teams).forEach(key => {
            teams[key] = teams[key].filter(name => name !== currentUser);
        });

        // ✅ Add user to the selected team
        teams[team].push(currentUser);

        // ✅ Update Firebase database
        set(ref(db, "teams"), teams).then(() => {
            console.log(`User ${currentUser} moved to ${team}`);
            updateAllLists(); // Refresh lists after update
        });
    });
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
            // ✅ Remove existing event listeners before adding a new one
            button.replaceWith(button.cloneNode(true));
            const newButton = document.getElementById(buttonId);

            newButton.addEventListener("click", () => {
                addUserToTeam(listId);
            });
        }
    });

    updateAllLists(); // Refresh lists when button toggles are set
}


// ✅ Function to remove user from all lists on sign-out
function removeUserFromLists() {
    get(ref(db, "teams")).then(snapshot => {
        let teams = snapshot.val() || { list1: [], list2: [], list3: [] };
        let currentUser = localStorage.getItem("currentUser");

        if (currentUser) {
            Object.keys(teams).forEach(key => {
                teams[key] = teams[key].filter(name => name !== currentUser);
            });

            set(ref(db, "teams"), teams); // Save updated lists
        }

        updateAllLists(); // Refresh displayed lists
    });
}

// ✅ Initialize Functions (Place this at the bottom of `main.mjs`)
handleSignUp();
setupButtonToggles();
getNextSaturdayLocal();
