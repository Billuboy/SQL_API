import * as yup from 'yup';

interface Body {
  movie_name: string;
  number_in_stock: number;
  rental_per_day: number;
  stars: number;
}

export default async (body: Body): Promise<Body | void> => {
  const schema = yup.object().shape({
    movieName: yup
      .string()
      .min(3, 'Movie Name must be atleast 3 characters long')
      .max(45, 'Movie Name must be atmost 45 characters long')
      .required('Movie Name is required'),
    rentalLeft: yup.number().required('Number In Stock is required'),
    rentPerDay: yup.number().required('Rental Price is required'),
    stars: yup.number().optional(),
  });

  try {
    await schema.validate(body, {
      strict: true,
      abortEarly: false,
    });
    return;
  } catch (err) {
    const error: any = {};

    err.inner.forEach(({ path, errors }: any) => {
      error[path] = errors[0];
    });

    return error;
  }
};
