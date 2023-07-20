const express = require('express')
const authenticate = require('../middleware/authenticate')
const groupController = require('../controllers/group')
const router = express.Router()

router.post('/createGroup', authenticate.authenticate, groupController.createGroup)
router.get('/getGroup', authenticate.authenticate, groupController.getGroups)

module.exports = router