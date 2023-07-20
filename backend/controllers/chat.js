const Chat = require('../models/chat');
const User = require('../models/user');
const Group = require('../models/group');
const UserGroup = require('../models/groupTable');
const AWS = require('aws-sdk')//imports the AWS SDK to handle file uploads to Amazon S3.
const {Op} = require('sequelize')

//sendMessage function is an asynchronous function that handles sending chat messages to a group. It checks 
//if the user is a member of the group and validates the message content. It then creates a new chat message
// using the createChat method on the req.user object and returns the created chat message as a response.
//code handles the creation of chat messages in a group chat, checks the user's membership in the group, 
exports.sendMessage = async (req, res, next) => {
    try {
        const { message } = req.body;//extracts message and groupId from request body and parameters
        const { groupId } = req.params; 
        
        //checks if current user is a member of specified group by querying the UserGroup model using findOne.
        const isUserInGroup = await UserGroup.findOne({ where: { userId: req.user.id, groupId: groupId } });
        if (!isUserInGroup) {
            return res.status(400).json({ success: false, message: 'You are no longer in group now !' });
        }

        if (!message) {
            return res.status(400).json({ success: false, message: 'Nothing entered !' });
        }

        let result = await req.user.createChat({//create new chat messages in database with provided message 
            message: message,//and groupId.******createChat kha se aaya. req.user kha s aaya*********
            groupId: groupId
        })
        
        const data = { message: result.message, createdAt: result.createdAt };//extracts relevant data from the
        //result of create chat  operation, including the message content and creation timestamp.
        return res.status(200).json({ success: true, data});
    } catch (err) {
        console.log(err);
        return res.status(404).json({ success: false, error: err })
    }
}

//getMessage function is an asynchronous function that retrieves chat messages for a group. It uses the Chat
//model to fetch messages that have an ID greater than the provided msgId and are associated with the 
//specified groupId. It maps the retrieved messages into a desired format and returns them as a response.
//code retrieves messages from a group chat based on the provided lastMessageId and groupId, includes the 
//associated user information, transforms the messages, and returns them in a simplified format
exports.getMessage = async (req, res, next) => { 
    let msgId = req.query.lastMessageId;//extracts the lastMessageId query parameter and the groupId 
    let { groupId } = req.params;
    console.log(`groupid ==> ${groupId}`);
    //checks if current user is member of the specified group by querying the UserGroup model using findOne
    const showMessages = await UserGroup.findOne({where:{UserId:req.user.id,groupId:groupId}})

    if(!showMessages){
        return res.status(404).json({success:false})
    }
    
    let messages = await Chat.findAll({//retrieves all chat messages in the group using the Chat model's findAll method.
        include: ['user'],//associated user model should be included in the result.
        where:[{id:{[Op.gt]:msgId}}, {groupId:groupId}]// selects messages with an ID greater than the msgId 
        //query parameter. It uses the Op.gt operator from Sequelize to perform the comparison.
        //groupId: groupId: This condition selects messages that belong to the specified group.
        //messages variable stores the retrieved chat messages.*****direct kaise check krega Op.gt**********
    });

    const { email } = req.user;// extracts the current user's email from the req.user object.
    console.log(`msgId`, msgId);

    const data = messages.map(chat => {//maps over the messages array and transforms each chat object into a
        let currentUser;// simplified format. It checks if the chat's user email matches the current user's 
        if (chat.user.email === email) {//email and sets the currentUser field accordingly
            currentUser = 'Same user';// transformed chat objects are stored in the data array.
        }
        return { message: chat.message, name: chat.user.name, createdAt: chat.createdAt,
                 currentUser: currentUser, id: chat.id };
    })
    
    res.status(200).json({ success: true, messages: data });
}

//addUser function is an asynchronous function that adds a user to a group.It validates the request parameters, 
//checks if the requesting user is an admin of the group, verifies if the user to be added exists, and checks 
//if the user is already a member of the group. If all checks pass, it creates a new user-group association 
//using the UserGroup model and returns a success response. this code handles the logic for adding a user to 
//a group, performs necessary checks and validations, and returns appropriate responses based on the success 
//or failure of the operation.
exports.addUser = async (req, res, next) => {
    try {
        const { groupId } = req.params;//extracts the groupId parameter from the request.
        const { email } = req.body;//extracts the email field from the request body.
        if (!email) {
            return res.status(500).json({ success: false, message: `Bad request !. Email not found` });
        }

        //checks if current user is admin of specified group by querying the UserGroup model using findOne
        const checkUserIsAdmin = await UserGroup.findOne({ where: { userId: req.user.id, groupId: groupId }});
        if (!checkUserIsAdmin.isAdmin) {
            return res.status(500).json({ success: false, message: `Only admin can add users !` });
        }

        if (req.user.email == email) {//checks if the admin's email is the same as the email provided
            return res.status(500).json({ success: false, message: `Admin is already in group !` });
        }

        const user = await User.findOne({ where: { email: email } });//It searches for a user with the
        //provided email by querying the User model using findOne.
        if (!user) {//*****user model m kia query krta hai */
            return res.status(500).json({ success: false, message: `User doesn't exist !` });
        }

        const alreadyInGroup = await UserGroup.findOne({ where: { userId: user.id, groupId: groupId } });
        if (alreadyInGroup) {//checks if user is already member of specified group by querying UserGroup model 
            return res.status(500).json({ success: false, message: `User already in group !` });//using findOne.
        }

        const data = await UserGroup.create({//creates a new record in the UserGroup model with the provided
            userId: user.id,//userId, groupId, and isAdmin set to false.*****usergroup model kha hai******
            groupId: groupId,
            isAdmin: false
        })

        res.status(200).json({ success: true, message: 'User successfully added !', data });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, message: `Something went wrong !` });
    }
}

//getUsers function retrieves the users of a group. It fetches user details and their admin status using the
//UserGroup and User models and returns retrieved data as a response. Code retrieves user details and admin 
//emails associated with group, performs necessary database queries, and returns results in structured format.
exports.getUsers = async (req, res, next) => {
    const { groupId } = req.params;//extracts the groupId parameter from the request
    console.log(groupId, 'id')

    try{
        //retrieves all user-group relationships associated with specified groupId by querying UserGroup model 
        const data = await UserGroup.findAll({ where: { groupId: groupId } });//using findAll. retrieved data
        // is stored in the data variable.****usergroup model kha hai*****
        
        //maps over data array and transforms each element into object containing user's ID and their admin 
        const users = data.map(element => {//status. transformed user objects are stored in users array.
            return { id: element.userId, isAdmin: element.isAdmin };
        });
        const userDetails = [];
        let adminEmail = [];
    
        for (let i = 0; i < users.length; i++) {//iterates over users array
            //searches for the user's details by querying the User model using their ID.
            const user = await User.findOne({ where: { id: users[i].id } });
            //It constructs object with user's name, admin status, and email, and adds it to userDetails array.
            userDetails.push({ name: user.name, isAdmin: users[i].isAdmin, email: user.email });
            if (users[i].isAdmin) {
                adminEmail.push(user.email);//If the user is admin, it adds their email to adminEmail array.
            }
        }
    
        res.status(200).json({ success: true, userDetails, adminEmail });
    }catch(err){
        console.log(err);
        res.status(500).json({success: false, message: 'Something went wrong !'})
    }
}

//makeAdmin function makes a user an admin of a group. It validates the request parameters, checks if the 
//requesting user is an admin of the group, and updates the isAdmin attribute of the user-group association 
//using the UserGroup model.
exports.makeAdmin = async (req, res, next) => { 
    console.log(req.body); 
    const { email } = req.body; 
    const { groupId } = req.params;

    if (!email) {
        return res.status(500).json({ success: false, message: 'bad request !' });
    }

    try {
        const checkUserIsAdmin = await UserGroup.findOne({ where: { groupId: groupId, userId: req.user.id } });
        if (checkUserIsAdmin.isAdmin == false) {
            return res.status(500).json({ success: false, message: `Only Admin have this permission !` });
        }

        const user = await User.findOne({ where: { email: email } });
        const data = await UserGroup.update({
            isAdmin: true
        }, { where: { groupId: groupId, userId: user.id } });


        res.status(200).json({ success: true, message: `Now ${user.name} is also Admin !` });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ success: false, message: 'Something went wrong !' });
    }
}

//deleteUser function removes a user from a group. It validates the request parameters, checks if requesting
//user is a member of the group, and verifies the user's admin status. If the user is not an admin, it deletes
//the user-group association. If the user is an admin, it performs additional checks to ensure that there is at
// least one admin remaining in the group before deleting the user.
exports.deleteUser = async (req, res, next) => {
    console.log(req.body, req.params); 
    const { groupId } = req.params;//
    const { email } = req.body;// 
    try {

        const checkUser = await UserGroup.findOne({ where: { groupId: groupId, userId: req.user.id } });
        if(!checkUser){
            return res.status(500).json({ success: false, message: `You are no longer in group !` });
        }

        //check whether user is admin or not.
        if (checkUser.isAdmin == false) {

            if (req.user.email == email) {
                await checkUser.destroy();
                return res.status(200).json({ success: true, message: `User has been deleted from group !` });
            }

            return res.status(500).json({ success: false, message: `Only admin can delete members from groups !` });
        }

        const user = await User.findOne({ where: { email: email } });
        // console.log(user);
        const usergroup = await UserGroup.findOne({ where: { userId: user.id, groupId: groupId } });
        // console.log(usergroup);

        if (usergroup.isAdmin == false) {
            usergroup.destroy();
            return res.status(200).json({ success: true, message: `User ${user.name} is deleted successfully !` });
        } else if(req.user.email == email){
            return res.status(500).json({ success: false, message: `Admin have to remove admin himself before leaving group !` });
        }else{
            return res.status(500).json({ success: false, message: `first remove admin before deleting user: ${user.name} !` });
        }


    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, message: `Something went wrong !` });
    }

}

//removeAdmin function removes admin privileges from a user. It validates the request parameters, checks if 
//the requesting user is an admin of the group, and updates the isAdmin attribute of user-group association
exports.removeAdmin = async (req, res, next) => {
    console.log(req.body, req.params); 
    const { email } = req.body;
    const { groupId } = req.params;
    try {

        const checkUserIsAdmin = await UserGroup.findOne({ where: { groupId: groupId, userId: req.user.id } });
        if (checkUserIsAdmin.isAdmin == false) {
            return res.status(500).json({ success: false, message: `Only Admin have this permission !` });
        }

        const user = await User.findOne({ where: { email: email } });
        const allAdmins = await UserGroup.findAll({ where: { groupId: groupId, isAdmin: true } });

        if (allAdmins.length == 1) {
            return res.status(500).json({ success: false, message: `make another user as an Admin !` })
        }

        const data = await UserGroup.update({
            isAdmin: false
        }, { where: { userId: user.id, groupId: groupId } });

        res.status(200).json({ success: true, message: `User ${user.name} is no longer admin now !` });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, message: `Something went wrong !` });
    }
}

//uploadToS3 function uploads a file to an Amazon S3 bucket. It uses the AWS SDK to create an S3 client and
// uploads the file buffer to the specified bucket. It returns the uploaded file's location as a promise.
updloadToS3 = (file, filename) => { 
    const BUCKET_NAME = process.env.BUCKET_NAME; 
    const IAM_USER_KEY = process.env.IAM_USER_KEY; 
    const IAM_USER_SECRET = process.env.IAM_USER_SECRET;
    let s3Bucket = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET,
    })
    var params = {
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: file,
        ACL: 'public-read'
    }
    return new Promise((resolve, reject) => {
        s3Bucket.upload(params, (err, s3responce) => {
            if (err) {
                console.log(`Something went wrong`, err);
                reject(err);
            } else {
                console.log(`work has done ===>`, s3responce);
                resolve(s3responce.Location);
            }
        })
    })
}

//sendFile function handles uploading files to a group.It validates the request parameters, retrieves the file
//buffer and filename, and uploads file to Amazon S3 using uploadToS3 function. It then creates a new chat
//message with file URL using createChat method on req.user object and returns created chat message as response.
exports.sendFile = async (req, res, next) => { 
    try{ 
        const { groupId } = req.params;
        if(!req.file){
           return res.status(400).json({ success: false, message: `Please choose file !` });
        }
    
        let type = (req.file.mimetype.split('/'))[1];
        console.log('type', type)
        const file = req.file.buffer;
        const filename = `GroupChat/${new Date()}.${type}`;
        console.log(`file ===>`, file );
        console.log('filename ====>', filename);
        const fileUrl = await updloadToS3(file,filename);
        console.log('fileUrl =============>',fileUrl);
    
        let result = await req.user.createChat({
            message: fileUrl,
            groupId: groupId
        })
        const data = { message: result.message, createdAt: result.createdAt };
    
        res.status(200).json({ success: true, data });
    }catch(err){
        console.log(err);
        res.status(400).json({ success: false, message: `Something went wrong !` });
    }
}






// 1. What is the purpose of the code?
// The code is an implementation of a chat application's server-side logic. It provides functionalities such
// as sending messages, retrieving messages, adding users to a group, managing user roles (admin or regular),
// deleting users from a group, and uploading files to Amazon S3.

// 2. What frameworks or libraries are being used in this code?
// The code is using the following frameworks and libraries:
// - Express.js: A web application framework for Node.js.
// - Sequelize: An ORM (Object-Relational Mapping) library for interacting with databases.
// - AWS SDK: A software development kit for interacting with Amazon Web Services (AWS) services, used for
// uploading files to S3.

// 3. What endpoints or routes are defined in this code?
// The code defines the following endpoints or routes:
// - POST '/sendMessage/:groupId': Sends a message to a specific group.
// - GET '/getMessage/:groupId': Retrieves messages for a specific group.
// - POST '/addUser/:groupId': Adds a user to a specific group.
// - GET '/getUsers/:groupId': Retrieves the users in a specific group.
// - POST '/makeAdmin/:groupId': Assigns admin role to a user in a specific group.
// - POST '/deleteUser/:groupId': Deletes a user from a specific group.
// - POST '/removeAdmin/:groupId': Removes the admin role from a user in a specific group.
// - POST '/sendFile/:groupId': Uploads a file to a specific group.

// 4. What are the potential issues or improvements that can be made in this code?
// - Error handling: The error handling in the code could be improved to provide more specific error messages
   // and handle errors more gracefully.
// - Input validation: The code should perform proper input validation to ensure that the data received from 
     //the client is valid and prevent any potential security vulnerabilities.
// - Security: The code should implement authentication and authorization mechanisms to ensure that only 
    //authorized users can access and perform actions within the chat application.
// - Code organization: The code could benefit from better organization and modularization, separating concerns
    // into separate files or modules.
// - Logging: The code could include proper logging mechanisms to record events and errors for debugging and
     // monitoring purposes.

// Note: The code assumes the existence of the required models (Chat, User, Group, UserGroup) and proper 
//database configurations.


//By using `Op', we perform operations like greater than, less than, equal to, 
//between, and more in our Sequelize queries. For example `id:{[Op.gt]:msgId}` is using the `Op.gt` operator
//to find chat messages with an ID greater than `msgId`.`Op` object simplifies the process of constructing
// complex queries by providing set of predefined operators.