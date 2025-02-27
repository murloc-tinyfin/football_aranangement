// Function to calculate next Saturday
function getNextSaturdayLocal() {
    document.addEventListener("DOMContentLoaded", () => {
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
    });
}

// Function to handle sign-ups and show buttons
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

            if (reset || !currentUser) {
                // Reset UI when signing out
                welcomeMessage.textContent = "Welcome! Please sign in. 欢迎！请登录";
                signUpButton.textContent = "Sign In 登录";
                buttonContainer.style.display = "none"; // Hide buttons
                updateAllLists(); // Ensure lists update after sign-out
            } else {
                // Show UI when signing in
                welcomeMessage.textContent = `Welcome, ${currentUser}! Choose a team to sign up to. 欢迎, ${currentUser}!选择一个队报名`;
                signUpButton.textContent = "Sign Out 登出";
                buttonContainer.style.display = "block"; // Show buttons
                setupButtonToggles(); // Refresh buttons after signing in
            }
        }
    });
}

// Function to remove user from all lists on sign-out
function removeUserFromLists() {
    let userLists = JSON.parse(localStorage.getItem("userLists")) || { list1: [], list2: [], list3: [] };
    let currentUser = localStorage.getItem("currentUser");

    if (currentUser) {
        Object.keys(userLists).forEach(key => {
            userLists[key] = userLists[key].filter(name => name !== currentUser);
        });

        localStorage.setItem("userLists", JSON.stringify(userLists)); // Save updated lists
    }

    updateAllLists(); // Refresh displayed lists
}


function setupButtonToggles() {
    let userLists = JSON.parse(localStorage.getItem("userLists")) || { list1: [], list2: [], list3: [] };

    const buttons = [
        { buttonId: "btn1", listId: "list1" },
        { buttonId: "btn2", listId: "list2" },
        { buttonId: "btn3", listId: "list3" },
    ];

    buttons.forEach(({ buttonId, listId }) => {
        const button = document.getElementById(buttonId);
        const listElement = document.getElementById(listId);

        if (button && listElement) {
            // Remove existing event listeners to prevent duplication
            button.replaceWith(button.cloneNode(true)); 
            const newButton = document.getElementById(buttonId);

            newButton.addEventListener("click", () => {
                let currentUser = localStorage.getItem("currentUser");
                if (!currentUser) {
                    alert("Please sign up first! 请先登录");
                    return;
                }

                // Check if the user is already in the clicked list
                if (userLists[listId].includes(currentUser)) {
                    // If already in the list, remove them (so they are in no list)
                    userLists[listId] = userLists[listId].filter(name => name !== currentUser);
                } else {
                    // Remove user from any other list
                    Object.keys(userLists).forEach(key => {
                        userLists[key] = userLists[key].filter(name => name !== currentUser);
                    });

                    // Add user to the selected list
                    userLists[listId].push(currentUser);
                }

                // Save updated lists
                localStorage.setItem("userLists", JSON.stringify(userLists));

                // Refresh displayed lists
                updateAllLists();
            });

            // Ensure list is always visible and updated on page load
            updateAllLists();
        }
    });
}

// Function to update all lists' display
function updateAllLists() {
    let userLists = JSON.parse(localStorage.getItem("userLists")) || { list1: [], list2: [], list3: [] };
    ["list1", "list2", "list3"].forEach(listId => {
        const listElement = document.getElementById(listId);
        if (listElement) {
            listElement.innerHTML = userLists[listId].map(name => `<li>${name}</li>`).join("");
        }
    });
}



// Function to update the displayed list
function updateListDisplay(listId) {
    let userLists = JSON.parse(localStorage.getItem("userLists")) || { list1: [], list2: [], list3: [] };
    const listElement = document.getElementById(listId);
    if (listElement) {
        listElement.innerHTML = userLists[listId].map(name => `<li>${name}</li>`).join("");
    }
}




// Function to refresh name lists when a new user signs up
function updateNameLists() {
    const storedNames = JSON.parse(localStorage.getItem("userNames")) || [];

    const lists = ["list1", "list2", "list3"];
    lists.forEach(listId => {
        const listElement = document.getElementById(listId);
        if (listElement) {
            listElement.innerHTML = storedNames.map(name => `<li>${name}</li>`).join("");
        }
    });
}

// Initialize functions
handleSignUp();
setupButtonToggles();
getNextSaturdayLocal();