import { CustomValidator } from 'express-validator'

export const mutuallyExclusiveSendOptions: CustomValidator = (_value, { req }) => {
  const { sendNow, sendNotificationOnDate } = req.body;

  const hasSendNow = typeof sendNow === 'boolean' && sendNow === true;
  const hasScheduleDate = !!sendNotificationOnDate;

  if ((hasSendNow && hasScheduleDate) || (!hasSendNow && !hasScheduleDate)) {
    throw new Error(
      'You must either set "sendNow" to true or provide "sendNotificationOnDate", but not both or neither.'
    );
  }

  return true;
};
