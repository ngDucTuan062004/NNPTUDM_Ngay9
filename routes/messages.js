const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messages");
const { CheckLogin } = require("../utils/authHandler");
const multer = require('multer');
const path = require('path');

// Multer setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// GET all messages between current user and a specific userID
router.get("/:userID", CheckLogin, async (req, res) => {
    try {
        const messages = await messageController.GetMessagesBetweenUsers(req.user._id, req.params.userID);
        res.status(200).send(messages);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// POST a message
router.post("/", CheckLogin, upload.single('file'), async (req, res) => {
    try {
        let content, type;
        if (req.file) {
            type = 'file';
            content = req.file.path; // Or req.file.filename if preferred
        } else {
            type = 'text';
            content = req.body.text;
        }

        if (!content) {
            return res.status(400).send({ message: "Content (text or file) is required" });
        }

        const toUserID = req.body.to;
        if (!toUserID) {
            return res.status(400).send({ message: "Recipient (to) is required" });
        }

        const newMessage = await messageController.PostMessage(req.user._id, toUserID, content, type);
        res.status(201).send(newMessage);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// GET the last message of each conversation
router.get("/", CheckLogin, async (req, res) => {
    try {
        const lastMessages = await messageController.GetLastMessagesOfEachConversation(req.user._id);
        res.status(200).send(lastMessages);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

module.exports = router;
