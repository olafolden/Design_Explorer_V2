import type { LoadedFiles, DesignVariant } from '../store/types';

export async function loadDesignDirectory(files: FileList | File[]): Promise<LoadedFiles> {
  const fileArray = Array.from(files);

  // 1. Find and parse variants.json (or example.json)
  const variantsFile = fileArray.find(
    f => f.name === 'variants.json' || f.name === 'example.json'
  );

  if (!variantsFile) {
    throw new Error('variants.json or example.json not found in directory');
  }

  const variantsText = await variantsFile.text();
  const jsonData: DesignVariant[] = JSON.parse(variantsText);

  // 2. Process PLY files
  const plyFiles = new Map<string, string>();
  const plyFilesFound = fileArray.filter(f => f.name.endsWith('.ply'));

  for (const file of plyFilesFound) {
    const objectURL = URL.createObjectURL(file);
    plyFiles.set(file.name, objectURL);
  }

  // 3. Process thumbnails
  const thumbnails = new Map<string, string>();
  const thumbnailFiles = fileArray.filter(f =>
    f.name.match(/\.(png|jpg|jpeg)$/i) &&
    !f.name.includes('LandingPage') &&
    !f.name.includes('SelectedDesign')
  );

  for (const file of thumbnailFiles) {
    const objectURL = URL.createObjectURL(file);
    // Remove extension to get variant ID
    const variantId = file.name.replace(/\.(png|jpg|jpeg)$/i, '');
    thumbnails.set(variantId, objectURL);
  }

  console.log(`Loaded ${jsonData.length} variants, ${plyFiles.size} PLY files, ${thumbnails.size} thumbnails`);

  return { jsonData, plyFiles, thumbnails };
}
