const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  compatibilityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'mutual_like', 'rejected', 'blocked'],
    default: 'pending'
  },
  user1Action: {
    type: String,
    enum: ['none', 'like', 'pass', 'super_like'],
    default: 'none'
  },
  user2Action: {
    type: String,
    enum: ['none', 'like', 'pass', 'super_like'],
    default: 'none'
  },
  matchedAt: {
    type: Date
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  conversationStarted: {
    type: Boolean,
    default: false
  },
  iceBreakers: [{
    question: String,
    askedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answer: String,
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    askedAt: { type: Date, default: Date.now },
    answeredAt: Date
  }],
  compatibilityBreakdown: {
    lifestyle: Number,
    values: Number,
    interests: Number,
    location: Number,
    demographics: Number,
    preferences: Number
  }
}, {
  timestamps: true
});

// Ensure unique matches (no duplicate pairs)
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Check if match is mutual
matchSchema.methods.isMutual = function() {
  return this.user1Action === 'like' && this.user2Action === 'like';
};

// Update match status based on actions
matchSchema.methods.updateStatus = function() {
  if (this.user1Action === 'like' && this.user2Action === 'like') {
    this.status = 'mutual_like';
    if (!this.matchedAt) {
      this.matchedAt = new Date();
    }
  } else if (this.user1Action === 'pass' || this.user2Action === 'pass') {
    this.status = 'rejected';
  } else if (this.user1Action === 'block' || this.user2Action === 'block') {
    this.status = 'blocked';
  }
  this.lastInteraction = new Date();
};

// Static method to calculate compatibility score
matchSchema.statics.calculateCompatibility = function(profile1, profile2, user1, user2) {
  let score = 0;
  let maxScore = 0;

  // Age compatibility (20 points)
  maxScore += 20;
  const age1 = user1.age;
  const age2 = user2.age;
  const ageDiff = Math.abs(age1 - age2);
  if (ageDiff <= 2) score += 20;
  else if (ageDiff <= 5) score += 15;
  else if (ageDiff <= 10) score += 10;
  else if (ageDiff <= 15) score += 5;

  // Location compatibility (15 points)
  maxScore += 15;
  if (profile1.location.city === profile2.location.city) {
    score += 15;
  } else if (profile1.location.state === profile2.location.state) {
    score += 10;
  } else if (profile1.location.country === profile2.location.country) {
    score += 5;
  }

  // Education compatibility (15 points)
  maxScore += 15;
  const educationLevels = ['high_school', 'some_college', 'bachelors', 'masters', 'doctorate', 'professional'];
  const edu1Index = educationLevels.indexOf(profile1.education.level);
  const edu2Index = educationLevels.indexOf(profile2.education.level);
  const eduDiff = Math.abs(edu1Index - edu2Index);
  if (eduDiff === 0) score += 15;
  else if (eduDiff === 1) score += 10;
  else if (eduDiff === 2) score += 5;

  // Religion compatibility (10 points)
  maxScore += 10;
  if (profile1.religion === profile2.religion) {
    score += 10;
  } else if (profile1.religion && profile2.religion) {
    // Partial points for compatible religions
    const compatibleReligions = {
      'christian': ['christian'],
      'muslim': ['muslim'],
      'hindu': ['hindu'],
      'buddhist': ['buddhist'],
      'jewish': ['jewish'],
      'atheist': ['agnostic'],
      'agnostic': ['atheist']
    };
    if (compatibleReligions[profile1.religion]?.includes(profile2.religion)) {
      score += 5;
    }
  }

  // Lifestyle compatibility (15 points)
  maxScore += 15;
  let lifestyleScore = 0;
  if (profile1.lifestyle.smoking === profile2.lifestyle.smoking) lifestyleScore += 5;
  if (profile1.lifestyle.drinking === profile2.lifestyle.drinking) lifestyleScore += 5;
  if (profile1.lifestyle.diet === profile2.lifestyle.diet) lifestyleScore += 5;
  score += lifestyleScore;

  // Interests compatibility (15 points)
  maxScore += 15;
  const commonInterests = profile1.interests.filter(interest => 
    profile2.interests.includes(interest)
  );
  const interestScore = Math.min(15, commonInterests.length * 3);
  score += interestScore;

  // Children compatibility (10 points)
  maxScore += 10;
  if (profile1.wantChildren === profile2.wantChildren) {
    score += 10;
  } else if (
    (profile1.wantChildren === 'not_sure' || profile2.wantChildren === 'not_sure') ||
    (profile1.wantChildren === 'probably' && profile2.wantChildren === 'definitely') ||
    (profile1.wantChildren === 'definitely' && profile2.wantChildren === 'probably')
  ) {
    score += 5;
  }

  // Convert to percentage
  return Math.round((score / maxScore) * 100);
};

module.exports = mongoose.model('Match', matchSchema);