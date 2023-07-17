const Chat = require('../models/chat');
const User = require('../models/user');
const Group = require('../models/group');
const UserGroup = require('../models/groupTable');
const AWS = require('aws-sdk')//imports the AWS SDK to handle file uploads to Amazon S3.
const {Op} = require('sequelize')

exports.sendMessage = async (req, res, next) => {//sendMessage function is an asynchronous function that
    try {// handles sending chat messages to a group. It checks if the user is a member of the group and 
        //console.log(req.body);
        const { message } = req.body;//validates the message content. It then creates a new chat message using
        const { groupId } = req.params;// the createChat method on the req.user object and returns the created 

        const isUserInGroup = await UserGroup.findOne({ where: { userId: req.user.id, groupId: groupId } });
        if (!isUserInGroup) {//chat message as a response.
            return res.status(400).json({ success: false, message: 'You are no longer in group now !' });
        }

        if (!message) {
            return res.status(400).json({ success: false, message: 'Nothing entered !' });
        }

        let result = await req.user.createChat({
            message: message,
            groupId: groupId
        })
        
        const data = { message: result.message, createdAt: result.createdAt };

        return res.status(200).json({ success: true, data});
    } catch (err) {
        console.log(err);
        return res.status(404).json({ success: false, error: err })
    }
}


exports.getMessage = async (req, res, next) => {//getMessage function is an asynchronous function that 
    let msgId = req.query.lastMessageId;//retrieves chat messages for a group. It uses the Chat model to 
    let { groupId } = req.params;//fetch messages that have an ID greater than the provided msgId and are 
    console.log(`groupid ==> ${groupId}`);//associated with the specified groupId. It maps the retrieved .
    const showMessages = await UserGroup.findOne({where:{UserId:req.user.id,groupId:groupId}})

    if(!showMessages){//messages into a desired format and returns them as a response
        return res.status(404).json({success:false})
    }
    let messages = await Chat.findAll({
        include: ['user'],
        where:[{id:{[Op.gt]:msgId}},{groupId:groupId}]
    });

    const { email } = req.user;
    //console.log(messages)
    // const msgs = [];
    // for (let i = 0; i < messages.length; i++) {
    //     if (messages[i].id > msgId) {
    //         msgs.push(messages[i]);
    //     }
    // }

    console.log(`msgId`, msgId);
    //console.log(`message's length ==> ${msgs.length}`);

    const data = messages.map(chat => {
        let currentUser;
        if (chat.user.email === email) {
            currentUser = 'Same user';
        }
        return { message: chat.message, name: chat.user.name, createdAt: chat.createdAt, currentUser: currentUser, id: chat.id };
    })
    // console.log(messages);
    res.status(200).json({ success: true, messages: data });
}

exports.addUser = async (req, res, next) => {//addUser function is an asynchronous function that adds a user
    try {// to a group. It validates the request parameters, checks if the requesting user is an admin of the 
        const { groupId } = req.params;//group, verifies if the user to be added exists, and checks if the
        const { email } = req.body;// user is already a member of the group. If all checks pass, it creates 

        if (!email) {//a new user-group association using the UserGroup model and returns a success response.
            return res.status(500).json({ success: false, message: `Bad request !` });
        }

        const checkUserIsAdmin = await UserGroup.findOne({ where: { userId: req.user.id, groupId: groupId }});
        if (!checkUserIsAdmin.isAdmin) {
            return res.status(500).json({ success: false, message: `Only admin can add users !` });
        }

        if (req.user.email == email) {
            return res.status(500).json({ success: false, message: `Admin is already in group !` });
        }

        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(500).json({ success: false, message: `User doesn't exist !` });
        }

        const alreadyInGroup = await UserGroup.findOne({ where: { userId: user.id, groupId: groupId } });

        if (alreadyInGroup) {
            return res.status(500).json({ success: false, message: `User already in group !` });
        }

        const data = await UserGroup.create({
            userId: user.id,
            groupId: groupId,
            isAdmin: false
        })

        // const group = await UserGroup.findOne({where : {groupId : groupId}});
        res.status(200).json({ success: true, message: 'User successfully added !', data });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, message: `Something went wrong !` });
    }

}

exports.getUsers = async (req, res, next) => {//getUsers function retrieves the users of a group. It fetches 
    const { groupId } = req.params;//user details and their admin status using the UserGroup and User models 
    console.log(groupId, 'id')//and returns the retrieved data as a response.

    try{
        const data = await UserGroup.findAll({ where: { groupId: groupId } });
        const users = data.map(element => {
            return { id: element.userId, isAdmin: element.isAdmin };
        });
        const userDetails = [];
        let adminEmail = [];
    
        for (let i = 0; i < users.length; i++) {
            const user = await User.findOne({ where: { id: users[i].id } });
            userDetails.push({ name: user.name, isAdmin: users[i].isAdmin, email: user.email });
            if (users[i].isAdmin) {
                adminEmail.push(user.email);
            }
        }
    
        res.status(200).json({ success: true, userDetails, adminEmail });
    }catch(err){
        console.log(err);
        res.status(500).json({success: false, message: 'Something went wrong !'})
    }
}

exports.makeAdmin = async (req, res, next) => {//makeAdmin function makes a user an admin of a group. It 
    console.log(req.body);//validates the request parameters, checks if the requesting user is an admin 
    const { email } = req.body;//of the group, and updates the isAdmin attribute of the user-group 
    const { groupId } = req.params;//association using the UserGroup model.

    if (!email) {
        return res.status(500).json({ success: false, message: 'bad request !' });
    }

    try {
        const checkUserIsAdmin = await UserGroup.findOne({ where: { groupId: groupId, userId: req.user.id } });
        if (checkUserIsAdmin.isAdmin == false) {
            return res.status(500).json({ success: false, message: `Only Admin have this permission !` });
        }

        const user = await User.findOne({ where: { email: email } });
        // console.log(user);
        const data = await UserGroup.update({
            isAdmin: true
        }, { where: { groupId: groupId, userId: user.id } });


        res.status(200).json({ success: true, message: `Now ${user.name} is also Admin !` });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ success: false, message: 'Something went wrong !' });
    }
}

exports.deleteUser = async (req, res, next) => {//deleteUser function removes a user from a group. It 
    console.log(req.body, req.params);//validates the request parameters, checks if the requesting user 
    const { groupId } = req.params;//is a member of the group, and verifies the user's admin status. If the 
    const { email } = req.body;//user is not an admin, it deletes the user-group association. If the user is 
    try {//an admin, it performs additional checks to ensure that there is at least one admin remaining in 

        const checkUser = await UserGroup.findOne({ where: { groupId: groupId, userId: req.user.id } });
        if(!checkUser){//the group before deleting the user.
            return res.status(500).json({ success: false, message: `You are no longer in group !` });
        }

        //check whether user is admin or not.
        if (checkUser.isAdmin == false) {
            //if user try to delete ourself.

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

exports.removeAdmin = async (req, res, next) => {//removeAdmin function removes admin privileges from a user.
    console.log(req.body, req.params);// It validates the request parameters, checks if the requesting user 
    const { email } = req.body;//is an admin of the group, and updates the isAdmin attribute of the 
    const { groupId } = req.params;//user-group association.
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

updloadToS3 = (file, filename) => {//uploadToS3 function uploads a file to an Amazon S3 bucket. It uses the 
    const BUCKET_NAME = process.env.BUCKET_NAME;//AWS SDK to create an S3 client and uploads the file buffer 
    const IAM_USER_KEY = process.env.IAM_USER_KEY;//to the specified bucket. It returns the uploaded file's 
    const IAM_USER_SECRET = process.env.IAM_USER_SECRET;//location as a promise.

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

exports.sendFile = async (req, res, next) => {//sendFile function handles uploading files to a group. It 
    try{//validates the request parameters, retrieves the file buffer and filename, and uploads the file 
        const { groupId } = req.params;//to Amazon S3 using the uploadToS3 function. It then creates a new 
        if(!req.file){//chat message with the file URL using the createChat method on the req.user object and 
           return res.status(400).json({ success: false, message: `Please choose file !` });
        }//returns the created chat message as a response.
    
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



// Question: Can you explain the purpose and functionality of the provided code?
// The provided code is a server-side implementation for handling a chat application. It includes various 
//functionalities related to sending messages, managing users in groups, uploading files to Amazon S3, and 
//retrieving chat messages.

// Here's a breakdown of the code and its functionalities:
// 1. **sendMessage**: This function handles the sending of messages in a group chat. It checks if the user
// is a member of the group, validates the message input, and creates a new chat entry in the database using
// the logged-in user's information.

// 2. **getMessage**: This function retrieves chat messages from a specific group. It takes the last message
// ID as a query parameter to fetch only new messages since the last retrieved message. It also checks if the
// user is a member of the group before retrieving the messages.

// 3. **addUser**: This function allows an admin user to add new users to a group. It verifies if the requesting
// user is an admin, checks if the user to be added exists, and ensures the user is not already in the group.
// If all checks pass, it creates a new entry in the UserGroup model to associate the user with the group.

// 4. **getUsers**: This function retrieves the list of users in a specific group. It fetches user details 
//from the User model and combines them with the isAdmin status obtained from the UserGroup model.

// 5. **makeAdmin**: This function allows an admin user to make another user an admin of the group. It 
//verifies if the requesting user is an admin and updates the isAdmin status of the specified user in the
// UserGroup model.

// 6. **deleteUser**: This function handles the removal of a user from a group. It checks if the requesting
// user is an admin and ensures that only admins can remove members (except for themselves). It also checks
// if the requesting user is still a member of the group. Once the checks pass, it removes the specified user
// from the UserGroup model.

// 7. **removeAdmin**: This function allows an admin user to remove admin privileges from another user in the
// group. It performs similar checks as the makeAdmin function but updates the isAdmin status to false.

// 8. **uploadToS3**: This is a helper function used by the sendFile function to upload a file to Amazon S3.
// It uses the AWS SDK and the provided credentials (IAM_USER_KEY and IAM_USER_SECRET) to upload the file and returns the URL of the uploaded file.

// 9. **sendFile**: This function handles the uploading of files to a group chat. It verifies that a file has
// been provided, determines the file type, uploads the file to Amazon S3 using the uploadToS3 helper function,
// and creates a chat entry with the file URL in the database.

// Overall, the code provides a basic implementation for handling group chat functionality, including sending
// messages, managing users, and uploading files.