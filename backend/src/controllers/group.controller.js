export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { name, description, avatar } = req.body;

    const group = await Group.findOne({
      _id: groupId,
      "members.user": userId,
      isActive: true,
    });

    if (!group) {
      return res
        .status(404)
        .json({ error: "Group not found or you are not a member" });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (avatar) {
      if (avatar.startsWith("data:")) {
        const uploadResponse = await cloudinary.uploader.upload(avatar);
        group.avatar = uploadResponse.secure_url;
      } else {
        group.avatar = avatar;
      }
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members.user", "fullName profilePic");

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      "members.user": userId,
      isActive: true,
    });

    if (!group) {
      return res
        .status(404)
        .json({ error: "Group not found or you are not a member" });
    }

    group.isActive = false;
    await group.save();

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds, avatar } = req.body;
    const adminId = req.user._id;

    let avatarUrl = "";
    if (avatar) {
      const uploadResponse = await cloudinary.uploader.upload(avatar);
      avatarUrl = uploadResponse.secure_url;
    }

    const members = [
      {
        user: adminId,
        role: "admin",
      },
    ];

    if (memberIds && memberIds.length > 0) {
      for (const memberId of memberIds) {
        if (memberId !== adminId.toString()) {
          members.push({
            user: memberId,
            role: "member",
          });
        }
      }
    }

    const newGroup = new Group({
      name,
      description,
      avatar: avatarUrl,
      admin: adminId,
      members,
    });

    await newGroup.save();

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("admin", "fullName profilePic")
      .populate("members.user", "fullName profilePic");

    io.emit("groupCreated", populatedGroup);
    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      "members.user": userId,
      isActive: true,
    })
      .populate("admin", "fullName profilePic")
      .populate("members.user", "fullName profilePic")
      .sort({ updatedAt: -1 });

    const groupsWithUnseenCounts = await Promise.all(
      groups.map(async (group) => {
        const unseenCount = await GroupMessage.countDocuments({
          groupId: group._id,
          "readBy.userId": { $ne: userId },
        });

        return {
          ...group.toObject(),
          unseenCount,
        };
      })
    );

    res.status(200).json(groupsWithUnseenCounts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      "members.user": userId,
      isActive: true,
    })
      .populate("admin", "fullName profilePic")
      .populate("members.user", "fullName profilePic");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      "members.user": userId,
      isActive: true,
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const messages = await GroupMessage.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      "members.user": senderId,
      isActive: true,
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new GroupMessage({
      groupId,
      senderId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const populatedMessage = await GroupMessage.findById(
      newMessage._id
    ).populate("senderId", "fullName profilePic");

    group.members.forEach((member) => {
      const memberSocketId = getReceiverSocketId(member.user.toString());
      if (memberSocketId && member.user.toString() !== senderId.toString()) {
        io.to(memberSocketId).emit("newGroupMessage", populatedMessage);
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markGroupMessagesAsRead = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      "members.user": userId,
      isActive: true,
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    await GroupMessage.updateMany(
      {
        groupId,
        "readBy.userId": { $ne: userId },
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date(),
          },
        },
      }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const adminId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      admin: adminId,
      isActive: true,
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found or not admin" });
    }

    const isAlreadyMember = group.members.some(
      (member) => member.user.toString() === memberId
    );

    if (isAlreadyMember) {
      return res.status(400).json({ error: "User is already a member" });
    }

    group.members.push({
      user: memberId,
      role: "member",
    });

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members.user", "fullName profilePic");

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const adminId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      isActive: true,
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found or not admin" });
    }

    group.members = group.members.filter(
      (member) => member.user.toString() !== memberId
    );

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members.user", "fullName profilePic");

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      "members.user": userId,
      isActive: true,
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    group.members = group.members.filter(
      (member) => member.user.toString() !== userId
    );

    if (group.members.length === 0) {
      group.isActive = false;
    }

    await group.save();

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
