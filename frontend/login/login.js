const form = document.getElementById('login');
form.addEventListener('submit',login)

async function login(e){
    try{
        e.preventDefault();

        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        const obj = {email,password}
        console.log(obj)

        const response = await axios.post('http://localhost:3000/user/login', obj)
        console.log(response)
        
        alert(response.data.message)
        localStorage.setItem('token',response.data.token)
        localStorage.setItem('username',response.data.userName)
        localStorage.setItem('email' , response.data.email);
        
        window.location.href = '../group/group.html'
    }
    catch(err){
        console.log(err)
        alert(err.response.data.message)
    }
}