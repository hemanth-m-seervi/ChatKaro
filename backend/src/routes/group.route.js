
import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  createGroup,
  getGroups,
  getGroupDetails,
  getGroupMessages,
  sendGroupMessage,
  markGroupMessagesAsRead,
  addMemberToGroup,
  removeMemberFromGroup,
  leaveGroup,
  deleteGroup,
  updateGroup,
} from '../controllers/group.controller.js';

const router = express.Router();


router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.get("/:groupId", protectRoute, getGroupDetails);
router.post("/:groupId/leave", protectRoute, leaveGroup);


router.put('/:groupId', protectRoute, updateGroup);


router.delete('/:groupId', protectRoute, deleteGroup);


router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.post("/:groupId/messages", protectRoute, sendGroupMessage);
router.put("/:groupId/messages/read", protectRoute, markGroupMessagesAsRead);


router.post("/:groupId/members", protectRoute, addMemberToGroup);
router.delete("/:groupId/members/:memberId", protectRoute, removeMemberFromGroup);

export default router; 