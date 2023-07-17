const Group = require('../models/group');
const UserGroup = require('../models/groupTable');

exports.createGroup = async (req, res, next) => {
    const {group_name} = req.body;

    const group = await req.user.createGroup({
        groupName: group_name
    }, {through: {isAdmin : true}})

    console.log(`success ===>group`);
    return res.status(200).json({success : true, name: group.groupName , id:group.id});

}

exports.getGroups= async (req, res, next) => {
    const arrayOfGroups = await req.user.getGroups({
        attributes : ["id" , "groupName"],
    } );
    
    console.log(arrayOfGroups)
    const groups = arrayOfGroups.map(ele => {
        return {id : ele.id, name: ele.groupName};
    });

    res.status(200).json({success : true, groups});
}