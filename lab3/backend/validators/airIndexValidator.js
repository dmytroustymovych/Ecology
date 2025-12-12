const Joi = require('joi');

const pollutantSchema = Joi.number().min(0).allow(null).optional();

const airIndexCalcSchema = Joi.object({
  stationId: Joi.string().required().trim().min(1).max(100),
  datetime: Joi.date().iso().required(),
  pollutants: Joi.object({
    PM25: pollutantSchema,
    PM10: pollutantSchema,
    NO2: pollutantSchema,
    SO2: pollutantSchema,
    O3: pollutantSchema
  }).required().min(1),
  limits: Joi.object({
    PM25: Joi.number().positive().optional(),
    PM10: Joi.number().positive().optional(),
    NO2: Joi.number().positive().optional(),
    SO2: Joi.number().positive().optional(),
    O3: Joi.number().positive().optional()
  }).optional()
});

const validateAirIndexCalc = (data) => {
  const { error, value } = airIndexCalcSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { valid: false, errors, value: null };
  }

  return { valid: true, errors: null, value };
};

module.exports = {
  validateAirIndexCalc,
  airIndexCalcSchema
};
