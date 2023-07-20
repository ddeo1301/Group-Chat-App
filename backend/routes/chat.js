const express = require('express');

const authenticateController = require('../middleware/authenticate')
const chatController = require('../controllers/chat')
const router  = express.Router();
const multer = require('multer')
const upload = multer()

router.get('/getMessage/:groupId', authenticateController.authenticate, chatController.getMessage)
router.post('/sendMessage/:groupId', authenticateController.authenticate, chatController.sendMessage)
router.get('/getUsers/:groupId' ,authenticateController.authenticate,  chatController.getUsers);
router.post('/addUser/:groupId' , authenticateController.authenticate ,  chatController.addUser);
router.post('/makeAdmin/:groupId' , authenticateController.authenticate ,  chatController.makeAdmin);
router.post('/deleteUser/:groupId' , authenticateController.authenticate ,  chatController.deleteUser);
router.post('/removeAdmin/:groupId' , authenticateController.authenticate ,  chatController.removeAdmin);
router.post('/sendfile/:groupId',authenticateController.authenticate,upload.single('file'),chatController.sendFile)

module.exports = router;
