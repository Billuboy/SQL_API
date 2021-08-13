import * as yup from 'yup';

interface Body {
  name: string;
  password: string;
}

export default async (body: Body): Promise<Body | void> => {
  const schema = yup.object().shape({
    name: yup
      .string()
      .min(3, 'Name must be atleast 3 characters long')
      .max(45, 'Name must be atmost 45 characters long')
      .required('Name is required'),
    password: yup
      .string()
      .min(8, 'Must be atleast 8 characters long')
      .max(30, 'Must be atmost 30 characters long')
      .required('Password is required'),
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
