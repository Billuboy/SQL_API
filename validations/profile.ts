import * as yup from 'yup';

interface Body {
  dob: Date;
  isAdmin: boolean;
}

interface ErrorBody {
  dob: string;
  isAdmin: string;
}

export default async (body: Body): Promise<ErrorBody | void> => {
  const schema = yup.object().shape({
    dob: yup.string().required('DOB is required'),
    isAdmin: yup.boolean().optional(),
  });

  try {
    await schema.validate(body, { strict: true, abortEarly: false });
    return;
  } catch (err) {
    const error: any = {};

    err.inner.forEach(({ path, errors }: any) => {
      error[path] = errors[0];
    });

    return error;
  }
};
