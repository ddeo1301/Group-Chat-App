const Group = require('../models/group');
const UserGroup = require('../models/groupTable');

exports.createGroup = async (req, res, next) => {//asynchronous fn exported by the module which handles 
    const {group_name} = req.body;//creation of new group

    const group = await req.user.createGroup({//createGroup method is called on the req.user object, which 
        groupName: group_name//represents the authenticated user.  It creates a new group with the specified 
    }, {through: {isAdmin : true}})//groupName and sets the isAdmin attribute to true for the associated user
    // using the through option.
    console.log(`success ===>group`);//After successfully creating the group, a success response is sent with 
    return res.status(200).json({success : true, name: group.groupName , id:group.id});//the status code 200. 
    //The response includes the group's name and ID.
}

exports.getGroups= async (req, res, next) => {//asynchronous function exported by the module. It retrieves 
    const arrayOfGroups = await req.user.getGroups({//the groups associated with the authenticated user.
        attributes : ["id" , "groupName"],//getGroups method is called on the req.user object to fetch all
    } );//the groups.Method includes the attributes option to specify which attributes of groups should be returned.
    
    console.log(arrayOfGroups)//retrieved groups are transformed into an array of objects containing the group 
    const groups = arrayOfGroups.map(ele => {//ID and name.
        return {id : ele.id, name: ele.groupName};//success response is sent with the status code 200. The 
    });//response includes the array of groups.

    res.status(200).json({success : true, groups});
}