const form = document.getElementById('chat-form');
const backendAPIs = 'http://localhost:3000/chat';
const chat = document.getElementById('chat');
const searchBoxForm = document.getElementById('form-group');

const token = localStorage.getItem('token');
const groupId = localStorage.getItem('groupId');//retrieving data from localstorage
const groupName = localStorage.getItem('groupName');
let userEmail = localStorage.getItem('email');
let username = localStorage.getItem('username');

let chatArray = [];
let lastMessageId;

const socket = io('http://localhost:3000/')//establishes socket connection using socket.io library and listen
//for the 'connect' event
socket.on('connect',()=>{
    console.log(socket.id);
});

socket.on('response', data => {//response event is handled by socket.on method which logs the received data
    console.log(data)//and calls the showOtherMessgeOnScreen function to display the message on the screen
    showOtherMessgeOnScreen({message:data})
});

window.addEventListener('DOMContentLoaded', async () => {//DOMContentLoaded event listener is used to 
   const setIntervalId = setInterval(async ()=>{//initializethe chat application when the page loads. It fetches
        document.getElementById('groupname').innerText = groupName;//chat messages from backend API, updates 
        document.getElementById('username').innerText = `Hey! ${username.split(" ")[0]}`;//UI with the 

         let message = JSON.parse(localStorage.getItem(`messages${groupId}`));//messages, and sets up an 
         if (message == undefined || message.length == 0) {//interval to regularly fetch new messages.
             lastMessageId = 0;
         } else {
             lastMessageId = message[message.length - 1].id;
         }

        const response = await axios.get(`${backendAPIs}/getMessage/${groupId}?lastMessageId=${lastMessageId}`, { headers: { 'Authorization': token } });
        // console.log(response.data);
        //console.log(response)
        if(response.status===404){
            const oldChat = localStorage.getItem(`messages${groupId}`)
            console.log(oldChat)
            oldChat.forEach(ele => {
                if (ele.currentUser) {
                    showMyMessageOnScreen(ele);
                } else {
                    showOtherMessgeOnScreen(ele);
                }
            });
        }
        else{
            const backendArray = response.data.messages;
    
            if (message) {
                chatArray =message.concat(backendArray)
            } else {
                chatArray = chatArray.concat(backendArray);
            }
    
            if (chatArray.length > 10) {
                chatArray = chatArray.slice(chatArray.length - 10);
            }
        
            const localStorageMessages = JSON.stringify(chatArray);
            localStorage.setItem(`messages${groupId}`, localStorageMessages);
    
            // console.log(`messages===>`, JSON.parse(localStorage.getItem(`messages${groupId}`)));
            chat.innerHTML = ""
            chatArray.forEach(ele => {
                if (ele.currentUser) {
                    showMyMessageOnScreen(ele);
                } else {
                    showOtherMessgeOnScreen(ele);
                }
            });

        }
        openBox()
    },2000)
    //clearInterval(setIntervalId)
})

form.addEventListener('click', async (e) => {//'click' event listener on the chat form handles sending 
    if (e.target.classList.contains('sendchat')) {//messages. It emits a 'message' event through the socket 
        try {//and makes a POST request to the backend API to send the message. The response is logged, and 
            e.preventDefault();//the message is displayed on the screen using the showMyMessageOnScreen function.
            const message = e.target.parentNode.message.value;

            socket.emit('message', message)

            const response = await axios.post(`${backendAPIs}/sendMessage/${groupId}`, { message: message }, { headers: { 'Authorization': token } });
            console.log(response.data);
            showMyMessageOnScreen(response.data.data);
            e.target.parentNode.message.value = null;

        } catch (err) {
            console.log(err);
            if (err.response.status == 400) {
                return alert(err.response.data.message);
            }
            return document.body.innerHTML += `<div class="error">Something went wrong !</div>`;
        }

    }
})


searchBoxForm.addEventListener('click', async (e) => {// 'click' event listener on the search box form handles  
    if (e.target.classList.contains('search-btn')) {//adding users to the chat group.It makes a POST request 
        try {//to the backend API with the email of the user to be added. The response is logged, and an 
            e.preventDefault();//alert is shown with the corresponding message.
            // console.log('searchBTN');
            // console.log(e.target.parentNode.email.value);
            const email = e.target.parentNode.email.value.trim();
            const response = await axios.post(`${backendAPIs}/addUser/${groupId}`, { email: email }, { headers: { 'Authorization': token } });

            console.log(response);

            alert(response.data.message);
        } catch (err) {
            console.log(err);
            alert(err.response.data.message);
        }

        e.target.parentNode.email.value = "";

    }
})


function showMyMessageOnScreen(obj) {
    const timeForUser = time(obj.createdAt);
    const dateOfUser = date(obj.createdAt);
    chat.innerHTML += `
            <li class="me">
            <div class="entete">
              <h3>${timeForUser}, ${dateOfUser}</h3>
              <h2>${username}</h2>
              <span class="status blue"></span>
            </div>
            <div class="triangle"></div>
            <div class="message">
              ${obj.message}
            </div>
          </li>
          `
}

function showOtherMessgeOnScreen(obj) {//displays messages from other users on the screen, including the 
    const timeForUser = time(obj.createdAt);//message content, timestamp, and user information.
    const dateOfUser = date(obj.createdAt);

    chat.innerHTML += `
            <li class="you">
                <div class="entete">
                    <span class="status green"></span>
                    <h2>${obj.name}</h2>
                    <h3>${timeForUser}, ${dateOfUser}</h3>
                </div>
                <div class="triangle"></div>
                <div class="message">
                    ${obj.message}
                </div>
            </li>
          `
}


function time(string) {
    const time_object = new Date(string);
    return time_object.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
}

function date(string) {//time and date functions format the timestamp and date respectively.
    const today = new Date();
    const date_object = new Date(string);

    const today_date = `${today.getDate()}-${(today.getMonth() + 1)}-${today.getFullYear()}`;
    const yesterday_date = `${today.getDate() - 1}-${(today.getMonth() + 1)}-${today.getFullYear()}`;
    const gettingDate = `${date_object.getDate()}-${(date_object.getMonth() + 1)}-${date_object.getFullYear()}`;

    if (today_date == gettingDate) {
        return 'Today';
    } else if (gettingDate == yesterday_date) {
        return 'Yesterday'
    }
    return date_object.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}


const allName = document.getElementById('group');

const burgerButton = document.querySelector(".burger-button");
const burgerMenu = document.querySelector(".burger-menu");

burgerButton.addEventListener("click", function() {
    burgerButton.classList.toggle("active");
    burgerMenu.classList.toggle("active");
    openBox();
});



async function openBox() {//openBox function retrieves and displays the list of users in the chat group
    const users = await axios.get(`${backendAPIs}/getUsers/${groupId}`,{ headers: { 'Authorization': token } });
    const numOfUsers = users.data.userDetails.length;

    allName.innerHTML = `
    <li class="names"><u>User(${numOfUsers})</u><span style="float:right;"><u>Admin Status</u></span></li>
    `
    if (users.data.adminEmail.includes(userEmail)) {//It makes a GET request to the backend API to fetch the 
        users.data.userDetails.forEach(user => {//user details and updates the UI accordingly.
            displayNameForAdmin(user);
        })
    } else {
        users.data.userDetails.forEach(user => {
            displayNameForOther(user);
        })
    }

}


function displayNameForAdmin(user) {//functions handle displaying user names in the user list, along with 
    if (user.isAdmin) {//buttons for admin-related actions.
        allName.innerHTML += `
        <li class="names" id="name${user.email}">${user.name}<button class="delete" onClick="deleteUser('${user.email}')">-</button><button id="admin${user.email}" class="userButton" onClick="removeAdmin('${user.email}')">remove admin</button></li>
        `
    } else {
        allName.innerHTML += `
        <li class="names" id="name${user.email}">${user.name}<button class="delete" onClick="deleteUser('${user.email}')">-</button><button id="admin${user.email}" class="userButton" onClick="makeAdmin('${user.email}')">make admin</button></li>
        `
    }
    if (user.email == userEmail) {
        document.getElementById(`name${userEmail}`).style.color = "rgb(186, 244, 93)";
    }
}

// {/* <button class="delete" onClick="deleteUser('${user.email}')">-</button> */}

function displayNameForOther(user) {
    if (user.isAdmin) {
        allName.innerHTML += `
        <li class="names" id="name${user.email}">${user.name}</button><button class="userButton">Yes</button></li>
        `
    } else {
        allName.innerHTML += `
        <li class="names" id="name${user.email}">${user.name}</li>
        `
    }
    if (user.email == userEmail) {
        document.getElementById(`name${userEmail}`).style.color = "rgb(186, 244, 93)";
        document.getElementById(`name${userEmail}`).innerHTML += `
        <button class="delete" onClick="deleteUser('${userEmail}')">-</button>
        `
    }
}

async function makeAdmin(email) {//makeAdmin function is called when the admin button is clicked. It sends POST
    try {//request to backend API to make a user an admin of the chat group. UI is updated based on response.
        const response = await axios.post(`${backendAPIs}/makeAdmin/${groupId}`, { email: email }, { headers: { 'Authorization': token } });
        console.log(response);
        document.getElementById(`admin${email}`).innerText = 'remove admin';
        document.getElementById(`admin${email}`).setAttribute('onClick', `removeAdmin('${email}')`);

        alert(response.data.message);
    } catch (err) {
        console.log(err);
        alert(err.response.data.message);
    }

}


async function deleteUser(email) {//deleteUser function is called when the delete button is clicked.
    if (confirm('Are you sure')) {//It sends a POST request to the backend API to remove a user from the 
        try {//chat group. UI is updated based on the response.
            console.log(email);
            const response = await axios.post(`${backendAPIs}/deleteUser/${groupId}`, { email: email }, { headers: { 'Authorization': token } });
            console.log(response);
            allName.removeChild(document.getElementById(`name${email}`));
            let numOfUsers = allName.firstElementChild.innerText.split("\n")[0].split('(')[1].split(')')[0];
            numOfUsers = num-1;

            alert(response.data.message);
        } catch (err) {
            console.log(err);
            alert(err.response.data.message);
        }
    }
}

async function removeAdmin(email) {//removeAdmin function is called when the remove admin button is clicked
    try {// It sends a POST request to the backend API to remove admin privileges from a user
        if(confirm(`Are you sure ?`)){// UI is updated based on the response.
            console.log(email);
            const response = await axios.post(`${backendAPIs}/removeAdmin/${groupId}`, { email: email }, { headers: { 'Authorization': token } });
            console.log(response);
            document.getElementById(`admin${email}`).innerText = 'make admin';
            document.getElementById(`admin${email}`).setAttribute('onClick', `makeAdmin('${email}')`);
    
            alert(response.data.message);
        }
    } catch (err) {
        console.log(err);
        alert(err.response.data.message);
    }
}


function logout(){// clears the local storage and redirects the user to the login page.
    if(confirm('Are you sure ?')){
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        localStorage.removeItem('groupId');
        localStorage.removeItem('groupname');
        localStorage.removeItem('email');
        localStorage.removeItem('groupName');
        return window.location.href = '../login/login.html';
    }
}

async function backToGroups(){//redirects the user to the group page.
    window.location.href='../group/group.html'
}

async function uploadFile(){//uploadFile function is called when file is uploaded. It sends POST request to the
    try{//backend API to upload the file to the group chat
        const upload = document.getElementById('uploadFile')
        formData = new FormData(upload)
        const response = await axios.post(`${backendAPIs}/sendFile/${groupId}` , formData , { headers: { 'Authorization': token, "Content-Type":"multipart/form-data" } });
        //console.log(response.data);
        document.getElementById('sendFile').value = null;
        window.location.reload
        //showMyMessageOnScreen(responce.data.data);
        
    }
    catch(err){
        console.log(err)
    }
}



//1. What is the purpose of the code?
// The code is responsible for implementing the front-end logic of a chat application. It handles sending and
// receiving messages, displaying messages on the screen, managing user interactions, and making API calls to 
//the server.

// 2. What libraries or frameworks are being used in this code?
// The code is using the following libraries or frameworks:
// - Socket.IO: A library for enabling real-time, bidirectional communication between the browser and the 
       //server.
// - Axios: A popular JavaScript library for making HTTP requests from the browser.

// 3. What are the key functionalities implemented in this code?
// - Sending Messages: When the user submits a message through the chat form, it sends the message to the 
      //server using an HTTP POST request and displays the message on the screen.
// - Receiving Messages: The code listens for socket events from the server and displays received messages on 
      //the screen.
// - Displaying Messages: The code dynamically adds HTML elements to the chat container to display messages. 
      //It distinguishes between the user's own messages and other users' messages.
// - Adding Users: The code allows the user to add other users to the chat group by submitting their email 
      //addresses through a form.
// - Managing User Roles: The code provides options for making a user an admin or removing admin privileges 
     //from a user in the chat group.
// - Uploading Files: The code enables the user to upload files to the chat group by submitting a file
     // through a form.

// 4. Are there any potential issues or improvements in this code?

// - Error handling: The code lacks proper error handling for API requests and socket events. It should include
      // error handling mechanisms to provide better feedback to the user in case of failures.
// - Security: The code does not implement authentication or authorization mechanisms. It assumes that the user
     // is already authenticated and authorized to access the chat group. Proper security measures should be 
      //implemented to protect the application and user data.
// - Code structure: The code could benefit from better modularization and separation of concerns. Breaking
     // down the code into smaller functions and components would improve readability and maintainability.
// - Code duplication: Some parts of the code have repetitive code blocks, such as displaying messages. 
      //Extracting these repetitive parts into reusable functions would reduce code duplication.
// - Performance: The code retrieves messages from the server every 2 seconds using a setInterval function. 
     //This approach can cause unnecessary network traffic and put a strain on the server. Implementing a more 
    // efficient approach, such as real-time updates using WebSocket connections, would improve performance.



//Interviewer: Can you explain the purpose of the code?
//This code represents the front-end implementation of a chat application. Its main purpose is to enable 
//real-time communication between users in a chat group. Users can send and receive messages, add new users to
// the group, manage user roles (such as making someone an admin), and upload files to the chat group.
    
//Which libraries or frameworks are being used in this code?
//The code utilizes two main libraries. First, it uses Socket.IO, which is a library that enables real-time,
//bidirectional communication between the browser and the server. Socket.IO allows for instant message delivery
//and updates in the chat application. Second, it uses Axios, a popular JavaScript library for making HTTP 
//requests from the browser. Axios simplifies the process of sending HTTP requests to the server for actions
// like sending messages, adding users, and more.
    
//Interviewer: What are the key functionalities implemented in this code?
//The code implements several essential functionalities. First, it allows users to send messages through a 
//chat form. When a message is submitted, it makes an HTTP POST request to the server, which then broadcasts
// the message to all users in the chat group using Socket.IO. The received message is displayed on the user's
// screen in real-time.
//Second, the code enables users to add new members to the chat group. It provides a search box form where users
//can enter the email address of the person they want to add. The code then sends an HTTP POST request to the 
//server, which verifies the request and adds the user to the group if valid.
//Third, the code allows users with admin privileges to manage user roles within the chat group. Admins can 
//make other users admins or remove admin privileges from existing admins. These actions are also sent to the
// server via HTTP POST requests.    
//Lastly, the code supports file uploads to the chat group. Users can choose a file and upload it through a 
//form. The code sends the file to the server using an HTTP POST request and displays the uploaded file in the
// chat group for all users to see.
    
//Interviewer: Are there any potential issues or improvements in this code?
//Yes, there are a few potential areas for improvement. First, the code could benefit from better error 
//handling. Currently, it lacks detailed error messages and does not handle errors gracefully. Implementing
// robust error handling would provide users with better feedback and help them understand what went wrong.
//Second, the code does not include any authentication or authorization mechanisms. It assumes that the user
//is already authenticated and authorized to access the chat group. To enhance security, proper authentication
//and authorization measures should be implemented to ensure that only authorized users can access the chat 
//group.
//Third, the code structure could be improved for better maintainability. Some parts of the code contain
//repetitive code blocks, such as displaying messages. Extracting these repetitive parts into reusable 
//functions or components would reduce code duplication and improve code readability.
//Finally, the current approach of retrieving messages from the server every 2 seconds using setInterval can 
//be optimized for performance. Implementing a more efficient approach, such as using WebSocket connections
// for real-time updates, would reduce unnecessary network traffic and server load.
    
//By addressing these areas, the code can become more robust, secure, and maintainable, providing a better
// user experience for the chat application.  
