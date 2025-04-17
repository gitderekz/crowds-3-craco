// routes/agoraRoutes.js
const express = require('express');
const router = express.Router();
const Agora = require('agora-access-token');
const db = require('../models');
const {authenticate} = require('../middlewares/authMiddleware');

router.post('/agora-token', authenticate, async (req, res) => {
  try {
    const { channelName, uid } = req.body;
    
    if (!channelName || !uid) {
      return res.status(400).json({ message: 'Channel name and UID are required' });
    }

    const APP_ID = process.env.AGORA_APP_ID;
    const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
    const expirationTimeInSeconds = 3600; // 1 hour
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    const token = Agora.RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
    //   APP_CERTIFICATE,
      channelName,
      uid,
      Agora.RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    res.json({ token });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ message: 'Failed to generate token' });
  }
});

module.exports = router;