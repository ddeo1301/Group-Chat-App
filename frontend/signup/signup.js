const form = document.getElementById('addform');
form.addEventListener('submit', signup)

async function signup(e){
    try{
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const number = document.getElementById('number').value;
        const password = document.getElementById('password').value;

        const obj = {name, email, number, password};
        const response = await axios.post('http://localhost:3000/user/signup', obj)
        alert(response.data.message)
        
        window.location.href='../login/login.html'
    }
    catch(err){
        console.log(err)
    }
}