const {Op} = require('sequelize')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('../models/user');

function generateAcessToken(id){
    return jwt.sign({userId:id},'iamtheboss')
}

exports.postSignup = async (req,res)=>{
    try{
        const {name,email,number,password} = req.body;
        console.log(name);
        if(name.length==0||email.length==0||number.length==0||password.length==0){
            return res.status(500).json({sucess:false, message:'all fields required'})
        }
        const user = await User.findOne({where:{[Op.or]:[{email:email},{number:number}]}})
        if(!user){
        bcrypt.hash(password, 10, async (err,hash)=>{
            if(err){
                return res.status(500).json({error:err})
            }
            else{
                const data = await User.create({
                    name:name,
                    email:email,
                    number:number,
                    password:hash
                 })
                res.status(200).json({success:true,message:'signed up successfully'})
                }
            })
        }
        else{
            
            return res.status(500).json({success:false,message:'User already exist'})
        }
        }
    catch(err){
        console.log(err)
        res.status(500).json({err})
    }
}

exports.postLogin = async (req,res,next)=>{
    try{
        const {email,password} = req.body;
        if(email.length===0||password.length===0){
            return res.status(500).json({success:false,message:'all fields required'})
        }
        const user = await User.findOne({where:{email:email}});
        if(user){
            bcrypt.compare(password,user.password,(err,result)=>{
                if(err){
                    return res.status(500).json({success:false,message:'something went wrong'})
                }
                if(result==true){
                    return res.status(200).json({success:true,message:'login successfully',userName:user.name,email: user.email,
                    token:generateAcessToken(user.id)
                })
                }
                else{
                    res.status(500).json({success:false,message:"incorrect password"})
                }
                
            })
        }
        else{
            return res.status(404).json({success:false,message:'user not exist please signup'})
        }
    }
    catch(err){
        console.log(err)
    }
}
