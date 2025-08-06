const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true
  },
  height: {
    type: Number, // in centimeters
    min: 120,
    max: 250
  },
  weight: {
    type: Number, // in kilograms
    min: 30,
    max: 200
  },
  bodyType: {
    type: String,
    enum: ['slim', 'average', 'athletic', 'curvy', 'heavy']
  },
  maritalStatus: {
    type: String,
    required: [true, 'Marital status is required'],
    enum: ['never_married', 'divorced', 'widowed', 'separated']
  },
  hasChildren: {
    type: String,
    enum: ['no', 'yes_living_with_me', 'yes_not_living_with_me'],
    default: 'no'
  },
  wantChildren: {
    type: String,
    enum: ['definitely', 'probably', 'not_sure', 'probably_not', 'definitely_not'],
    default: 'not_sure'
  },
  education: {
    level: {
      type: String,
      enum: ['high_school', 'some_college', 'bachelors', 'masters', 'doctorate', 'professional'],
      required: true
    },
    field: String,
    institution: String
  },
  profession: {
    title: String,
    company: String,
    industry: String,
    experience: Number // years
  },
  income: {
    range: {
      type: String,
      enum: ['prefer_not_to_say', 'under_25k', '25k_50k', '50k_75k', '75k_100k', '100k_150k', '150k_plus']
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  location: {
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: String,
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  religion: {
    type: String,
    enum: ['christian', 'muslim', 'hindu', 'buddhist', 'jewish', 'sikh', 'other', 'atheist', 'agnostic', 'spiritual']
  },
  religiosity: {
    type: String,
    enum: ['very_religious', 'somewhat_religious', 'not_religious', 'prefer_not_to_say']
  },
  ethnicity: [String],
  languages: [{
    language: String,
    fluency: {
      type: String,
      enum: ['basic', 'conversational', 'fluent', 'native']
    }
  }],
  lifestyle: {
    smoking: {
      type: String,
      enum: ['never', 'socially', 'regularly', 'trying_to_quit']
    },
    drinking: {
      type: String,
      enum: ['never', 'socially', 'regularly', 'prefer_not_to_say']
    },
    diet: {
      type: String,
      enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'kosher', 'halal', 'other']
    },
    exercise: {
      type: String,
      enum: ['never', 'rarely', 'sometimes', 'regularly', 'daily']
    }
  },
  interests: [String],
  hobbies: [String],
  photos: [{
    url: String,
    caption: String,
    isMain: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lookingFor: {
    relationshipType: {
      type: String,
      enum: ['serious_relationship', 'marriage', 'friendship', 'casual'],
      default: 'marriage'
    },
    description: {
      type: String,
      maxlength: 300
    }
  },
  dealBreakers: [String],
  familyValues: {
    familyOrientation: {
      type: String,
      enum: ['very_important', 'somewhat_important', 'not_important']
    },
    traditionalRoles: {
      type: String,
      enum: ['strongly_agree', 'agree', 'neutral', 'disagree', 'strongly_disagree']
    }
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  profileViews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now }
  }],
  profileScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Calculate profile completion score
profileSchema.methods.calculateProfileScore = function() {
  let score = 0;
  const fields = [
    'bio', 'height', 'education.level', 'profession.title', 'location.city',
    'religion', 'lifestyle.smoking', 'lifestyle.drinking', 'interests',
    'lookingFor.relationshipType'
  ];
  
  fields.forEach(field => {
    const fieldValue = field.split('.').reduce((obj, key) => obj && obj[key], this);
    if (fieldValue && (Array.isArray(fieldValue) ? fieldValue.length > 0 : true)) {
      score += 10;
    }
  });
  
  if (this.photos && this.photos.length > 0) score += 20;
  if (this.photos && this.photos.length >= 3) score += 10;
  
  this.profileScore = score;
  this.isProfileComplete = score >= 70;
  return score;
};

// Index for location-based searches
profileSchema.index({ 'location.coordinates': '2dsphere' });
profileSchema.index({ 'user': 1 });
profileSchema.index({ 'isProfileComplete': 1 });

module.exports = mongoose.model('Profile', profileSchema);