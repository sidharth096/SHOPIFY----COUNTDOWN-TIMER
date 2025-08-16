import mongoose from "mongoose";

const timerBadgeSchema = new mongoose.Schema({
  timerName: {
    type: String,
    required: [true, 'Timer name is required'],
    trim: true,
    unique: true,
    minlength: [3, 'Timer name must be at least 3 characters'],
  },
  startDate: {
    type: String,
    default: '',
    validate: {
      validator: function (v) {
        return v === '' || /^\d{2}\/\d{2}\/\d{4}$/.test(v);
      },
      message: 'Start date must be in MM/DD/YYYY format or empty',
    },
  },
  startTime: {
    type: String,
    default: '',
    validate: {
      validator: function (v) {
        return v === '' || /^\d{2}:\d{2}$/.test(v);
      },
      message: 'Start time must be in HH:MM format or empty',
    },
  },
  endDate: {
    type: String,
    default: '',
    validate: {
      validator: function (v) {
        return v === '' || /^\d{2}\/\d{2}\/\d{4}$/.test(v);
      },
      message: 'End date must be in MM/DD/YYYY format or empty',
    },
  },
  endTime: {
    type: String,
    default: '',
    validate: {
      validator: function (v) {
        return v === '' || /^\d{2}:\d{2}$/.test(v);
      },
      message: 'End time must be in HH:MM format or empty',
    },
  },
  promotionDescription: {
    type: String,
    default: '',
    trim: true,
    maxlength: [500, 'Promotion description cannot exceed 500 characters'],
  },
  color: {
    type: String,
    default: '#78CCB3', // Converted from hsb(120, 50%, 80%)
    validate: {
      validator: function (v) {
        return /^#[0-9A-Fa-f]{6}$/.test(v);
      },
      message: 'Color must be a valid hex color (e.g., #RRGGBB)',
    },
  },
  timerSize: {
    type: String,
    enum: {
      values: ['Small', 'Medium', 'Large'],
      message: 'Timer size must be Small, Medium, or Large',
    },
    default: 'Medium',
  },
  timerPosition: {
    type: String,
    enum: {
      values: ['Top', 'Bottom', 'Left', 'Right'],
      message: 'Timer position must be Top, Bottom, Left, or Right',
    },
    default: 'Top',
  },
  urgencyNotification: {
    type: String,
    enum: {
      values: ['Color pulse', 'Notification banner', 'None'],
      message: 'Urgency notification must be Color pulse, Notification banner, or None',
    },
    default: 'Color pulse',
  },
  urgencyTriggerThreshold: {
    type: Number,
    default: 3600, // Default: 1 hour (in seconds) before end time
    min: [0, 'Urgency trigger threshold cannot be negative'],
    description: 'Time in seconds before end time to trigger urgency notification',
  },
}, {
  timestamps: true,
});

// Index for efficient querying
timerBadgeSchema.index({ timerName: 1 });

const TimerBadge = mongoose.model('TimerBadge', timerBadgeSchema);

export default TimerBadge;