const form = document.getElementById('form');
const backendAPIs = 'http://localhost:3000/group';
const token = localStorage.getItem('token');
const groups = document.getElementById('groups');

//getting all groups on screen
window.addEventListener('DOMContentLoaded', async() => {
    const intervalId = setInterval(async()=>{
        const response = await axios.get(`${backendAPIs}/getGroup`, {headers : {'Authorization' : token} });
        
        if(!response.data.groups.length){
           return groups.style.display = "none";
        }
        groups.innerHTML=""
        response.data.groups.forEach(ele => {
            groups.innerHTML += `
            <div  class="group-name" onClick="openThisGroup('${ele.id}','${ele.name}')">${ele.name}</div>
            `
        });       
    },2000)
    //clearInterval(intervalId)

})

//creating a group
form.addEventListener('click' , async (e) => {
    if(e.target.classList.contains('group')){
        e.preventDefault();
        console.log('group=======>');

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
    localStorage.setItem('groupId', id);
    localStorage.setItem('groupName', name);
    return window.location.href = '../chat/chat.html'
}

function logout(){
    if(confirm('Are you sure ?')){
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        return window.location.href = '../login/login.html';
    }
}