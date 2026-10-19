const User = require('../models/User');
const Bet = require('../models/Bet');
const Log = require('../models/Log');
const StoreItem = require('../models/StoreItem');
const PetItem = require('../models/PetItem');
const CosmeticItem = require('../models/CosmeticItem');
const CritterSpecies = require('../models/CritterSpecies');
const Critter = require('../models/Critter');
const Task = require('../models/Task');
const Achievement = require('../models/Achievement');
const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const { notificationStatus } = require('../utils/mailer');
const { uploadsDir } = require('../utils/uploadStorage');

function status(ok, details = {}) {
  return {
    ok,
    status: ok ? 'healthy' : 'needs_attention',
    ...details
  };
}

async function checkUploads() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    const probePath = path.join(uploadsDir, `.health-${Date.now()}`);
    await fs.writeFile(probePath, 'ok');
    await fs.unlink(probePath);
    return status(true, { path: uploadsDir });
  } catch (err) {
    return status(false, { message: err.message });
  }
}

async function checkSmtp() {
  const configuration = notificationStatus();
  return status(configuration.configured, {
    ...configuration,
    check: 'configuration',
    message: configuration.configured
      ? 'Ops notification configuration is ready; delivery has not been probed'
      : 'Ops notification configuration is unavailable',
  });
}

async function checkContentCounts() {
  const [
    storeItems,
    petItems,
    cosmetics,
    critterSpecies,
    critters,
    tasks,
    achievements
  ] = await Promise.all([
    StoreItem.countDocuments(),
    PetItem.countDocuments(),
    CosmeticItem.countDocuments(),
    CritterSpecies.countDocuments(),
    Critter.countDocuments(),
    Task.countDocuments(),
    Achievement.countDocuments()
  ]);

  const ok = storeItems > 0 && petItems > 0 && critterSpecies > 0 && tasks > 0 && achievements > 0;
  return status(ok, {
    storeItems,
    petItems,
    cosmetics,
    critterSpecies,
    critters,
    tasks,
    achievements,
    message: ok ? 'Content collections are populated' : 'Run npm --prefix backend run seed:content'
  });
}

exports.health = async (_req, res) => {
  const startedAt = Date.now();
  const mongoState = mongoose.connection.readyState;
  const mongoOk = mongoState === 1;
  const [uploads, smtp, content] = await Promise.all([checkUploads(), checkSmtp(), checkContentCounts()]);

  const checks = {
    api: status(true, {
      uptimeSeconds: Math.round(process.uptime()),
      nodeEnv: process.env.NODE_ENV || 'development',
    }),
    mongo: status(mongoOk, {
      state: mongoState,
      database: mongoose.connection.name || null,
    }),
    uploads,
    smtp,
    marketData: status(Boolean(process.env.ALPHA_VANTAGE_API_KEY), {
      provider: 'alpha_vantage',
      configured: Boolean(process.env.ALPHA_VANTAGE_API_KEY),
    }),
    publicUrls: status(Boolean(process.env.FRONTEND_URL && process.env.CORS_ORIGINS), {
      frontendUrlConfigured: Boolean(process.env.FRONTEND_URL),
      corsOriginsConfigured: Boolean(process.env.CORS_ORIGINS),
    }),
    content,
  };

  const ok = Object.values(checks).every(check => check.ok);
  res.status(ok ? 200 : 207).json({
    ok,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    checks
  });
};

exports.updateStatus = async (req, res) => {
  const { type, identifier } = req.params;
  const { status, reason } = req.body;

  try {
    let item;
    if (type === 'user') {
      item = await User.findOne({ username: identifier });
    }
    if (!item) {
      return res.status(404).json({ message: `${type} not found` });
    }

    item.status = status;
    if (reason) item.banReason = reason;
    await item.save();

    await Log.create({
      action: "Status Update",
      targetType: type.charAt(0).toUpperCase() + type.slice(1),
      targetId: item._id,
      admin: req.user._id,
      details: `${type} "${type === 'user' ? item.username : item.name}" status updated to ${status}`
    });

    res.json({ message: `${type} status updated`, status });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.modifyBalance = async (req, res) => {
  const { username } = req.params;
  const { amount } = req.body;

  if (typeof amount !== 'number' || isNaN(amount)) {
    return res.status(400).json({ message: "Invalid balance amount" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousBalance = user.balance;
    user.balance += amount;
    await user.save();

    await Log.create({
      action: "Balance Update",
      targetType: "User",
      targetId: user._id,
      admin: req.user._id,
      details: `Balance for ${username} updated from ${previousBalance} to ${user.balance} (Δ${amount})`
    });

    res.json({ 
      message: "Balance updated successfully",
      username,
      newBalance: user.balance
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateRole = async (req, res) => {
  const { username } = req.params;
  const { role } = req.body;
  const allowed = new Set(['user', 'game-master', 'admin', 'global-admin']);
  const adminAssignable = new Set(['user', 'game-master']);

  if (!allowed.has(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.user.role === 'admin') {
      if (!adminAssignable.has(role)) {
        return res.status(403).json({ message: 'Only global admins can assign admin roles' });
      }
      if (['admin', 'global-admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Only global admins can change admin users' });
      }
    }

    if (String(user._id) === String(req.user._id) && user.role === 'global-admin' && role !== 'global-admin') {
      return res.status(400).json({ message: 'You cannot remove your own global admin role' });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await Log.create({
      action: 'Role Update',
      targetType: 'User',
      targetId: user._id,
      admin: req.user._id,
      details: `${username} role changed from ${previousRole} to ${role}`
    });

    res.json({ message: 'Role updated', username, role });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBetOptions = async (req, res) => {
  const { title } = req.params;
  try {
    const bet = await Bet.findOne({ title }).select('options').lean();
    if (!bet) {
      return res.status(404).json({ message: "Bet not found" });
    }
    return res.json({ options: bet.options });
  } catch (err) {
    console.error("Error in getBetOptions:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateOptionOdds = async (req, res) => {
  const { title, optionId } = req.params;
  const { odds } = req.body;

  if (odds == null || isNaN(odds)) {
    return res.status(400).json({ message: "Invalid odds value" });
  }

  try {
    const bet = await Bet.findOne({ title });
    if (!bet) return res.status(404).json({ message: "Bet not found" });

    const opt = bet.options.id(optionId);
    if (!opt) return res.status(404).json({ message: "Option not found" });

    const prev = opt.odds;
    opt.odds = Number(odds);
    await bet.save();

    await Log.create({
      action:     "Odds Update",
      targetType: "Bet",
      targetId:   bet._id,
      admin:      req.user._id,
      details:    `Bet "${title}" option "${opt.text}" odds ${prev}→${opt.odds}`
    });

    res.json({ message: "Option odds updated", optionId, newOdds: opt.odds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({ status: { $ne: 'banned' } })
      .select("username balance status role")
      .lean();
    res.json(users);
  } catch (err) {
    console.error("Error listing users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listBets = async (req, res) => {
  try {
    const bets = await Bet.find({ result: null })
      .select("title options")
      .lean();
    res.json(bets);
  } catch (err) {
    console.error("Error listing bets:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.viewLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .sort({ timestamp: -1 })
      .populate('admin', 'username')
      .lean();

    const formatted = await Promise.all(logs.map(async log => {
      let targetName = 'Unknown';
      if (log.targetType === 'User') {
        const u = await User.findById(log.targetId).select('username').lean();
        if (u) targetName = u.username;
      } else if (log.targetType === 'Bet') {
        const b = await Bet.findById(log.targetId).select('title').lean();
        if (b) targetName = b.title;
      }
      return {
        timestamp:  log.timestamp,
        action:     log.action,
        admin:      log.admin?.username || 'System',
        targetType: log.targetType,
        target:     targetName,
        details:    log.details
      };
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ message: "Server error" });
  }
};
