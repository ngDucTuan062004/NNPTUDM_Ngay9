const messageModel = require("../schemas/messages");

module.exports = {
    GetMessagesBetweenUsers: async function (user1, user2) {
        return await messageModel.find({
            $or: [
                { from: user1, to: user2 },
                { from: user2, to: user1 }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('from', 'username fullName avatarUrl')
        .populate('to', 'username fullName avatarUrl');
    },

    PostMessage: async function (from, to, content, type) {
        let newMessage = new messageModel({
            from: from,
            to: to,
            messageContent: {
                type: type,
                text: content
            }
        });
        await newMessage.save();
        return await messageModel.findById(newMessage._id)
            .populate('from', 'username fullName avatarUrl')
            .populate('to', 'username fullName avatarUrl');
    },

    GetLastMessagesOfEachConversation: async function (currentUser) {
        return await messageModel.aggregate([
            {
                $match: {
                    $or: [
                        { from: currentUser },
                        { to: currentUser }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$from", currentUser] },
                            "$to",
                            "$from"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "otherUser"
                }
            },
            {
                $unwind: "$otherUser"
            },
            {
                $project: {
                    _id: 0,
                    lastMessage: 1,
                    otherUser: {
                        _id: 1,
                        username: 1,
                        fullName: 1,
                        avatarUrl: 1
                    }
                }
            }
        ]);
    }
};
