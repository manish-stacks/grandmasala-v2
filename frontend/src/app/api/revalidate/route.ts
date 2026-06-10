// import { revalidatePath } from 'next/cache';
// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(req: NextRequest) {
//   const { secret } = await req.json();

//   if (secret !== process.env.REVALIDATE_SECRET) {
//     return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//   }

//   revalidatePath('/', 'layout'); // Pura site clear

//   return NextResponse.json({ success: true, message: 'Cache cleared!' });
// }


import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const SECRET = process.env.REVALIDATE_SECRET;

export async function POST(req: NextRequest) {
  const { secret, paths, tags } = await req.json();

  if (secret !== SECRET) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Specific paths revalidate karo
  if (paths?.length) {
    for (const path of paths) {
      revalidatePath(path);
    }
  }

  // Tags se revalidate karo
  if (tags?.length) {
    for (const tag of tags) {
      revalidateTag(tag);
    }
  }

  // Koi nahi diya toh sab clear karo
  if (!paths?.length && !tags?.length) {
    revalidatePath('/', 'layout'); // Pura site
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Cache cleared!',
    revalidated: { paths, tags }
  });
}