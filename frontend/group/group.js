const form = document.getElementById('form');
const backendAPIs = 'http://localhost:3000/group';
const token = localStorage.getItem('token');
const groups = document.getElementById('groups');

//getting all groups on screen
window.addEventListener('DOMContentLoaded', async() => {//window.addEventListener('DOMContentLoaded'... event 
    const intervalId = setInterval(async()=>{//listener is used to initialize the group page when the page 
        const response = await axios.get(`${backendAPIs}/getGroup`, {headers : {'Authorization' : token} });
        
        if(!response.data.groups.length){//loads. It fetches all the groups associated with the user from the
           return groups.style.display = "none";// backend API and updates the UI with the group names.
        }
        groups.innerHTML=""
        response.data.groups.forEach(ele => {
            groups.innerHTML += `
            <div  class="group-name" onClick="openThisGroup('${ele.id}','${ele.name}')">${ele.name}</div>
            `
        });//setInterval function is used to periodically fetch the groups at a specific interval (every 2 seconds in this case). 
    },2000)//This ensures that the UI is always up to date with the latest groups
    //clearInterval(intervalId)
})

//creating a group
form.addEventListener('click' , async (e) => {// 'click' event listener on the form handles creating a new 
        e.preventDefault();//group. It sends a POST request to the backend API with the group name entered 
        if(e.target.classList.contains('group')){//by the user. The response is logged, and the UI is 
        console.log('group=======>');//updated with the newly created group name.

        const group_name = document.getElementById('group').value.trim();
        console.log(group_name)
        const response = await axios.post(`${backendAPIs}/createGroup`, {group_name : group_name} , {headers : {'Authorization' : token} });
        console.log(response);
        e.target.parentNode.parentNode.group.value = null;

        if(groups.style.display == 'none'){
            groups.style.display = 'block';
        }

        groups.innerHTML += `
        <div  class="group-name" onClick="openThisGroup('${response.data.id}','${response.data.name}')">${response.data.name}</div>
        `
    }
})

function openThisGroup(id, name){
    localStorage.setItem('groupId', id);//openThisGroup function is called when a group name is clicked. It 
    localStorage.setItem('groupName', name);//sets the group ID and group name in the local storage and.
    return window.location.href = '../chat/chat.html'// redirects the user to the chat page for that group
}

function logout(){//logout function clears the local storage and redirects the user to the login page.
    if(confirm('Are you sure ?')){
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        return window.location.href = '../login/login.html';
    }
}



