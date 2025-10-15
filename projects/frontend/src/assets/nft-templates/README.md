# NFT Templates

This folder contains pre-designed NFT templates that users can select when minting NFTs.

## How to Add Your Own Templates

1. **Add Image Files**: Place your image files (PNG, JPG, GIF, SVG) in this folder
   - Recommended size: 512x512px or larger
   - Supported formats: PNG, JPG, GIF, SVG
   - File naming: Use descriptive names like `cyber-warrior.png`, `space-cat.jpg`, etc.

2. **Update templates.json**: Add your template information to the `templates.json` file:

```json
{
  "id": "your-template-id",
  "name": "Your Template Name",
  "description": "Description of your NFT template",
  "image": "/src/assets/nft-templates/your-image-file.png",
  "category": "Art|Avatar|Collectible|Character|etc"
}
```

## Example Template Entry

```json
{
  "id": "cosmic-warrior",
  "name": "Cosmic Warrior",
  "description": "A powerful warrior from the cosmic realm with energy weapons",
  "image": "/src/assets/nft-templates/cosmic-warrior.png",
  "category": "Character"
}
```

## Categories

Use these standard categories or create your own:
- **Art**: Abstract art, digital paintings, generative art
- **Avatar**: Profile pictures, character portraits
- **Collectible**: Trading cards, collectible items
- **Character**: Game characters, mascots, creatures
- **Photography**: Digital photography, edited photos
- **Utility**: Functional NFTs, membership tokens

## Image Guidelines

- **Resolution**: Minimum 512x512px, recommended 1024x1024px
- **Format**: PNG for transparency, JPG for photos, SVG for vector art
- **File Size**: Keep under 10MB for better performance
- **Aspect Ratio**: Square (1:1) works best for NFTs

## Template Features

Templates automatically include:
- Pre-filled name and description
- Optimized metadata for Algorand ARC-3 standard
- IPFS upload via Pinata
- Explorer links for minted NFTs
- Responsive preview in the UI

## AI Generation

The system also includes AI image generation using Gemini API:
- Text-to-image prompts
- Multiple art styles (realistic, artistic, cartoon, abstract, cyberpunk, fantasy)
- Quick prompt templates
- Enhanced prompts using Gemini AI

To enable AI generation, add your Gemini API key to the `.env` file:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

Get your free API key at: https://makersuite.google.com/app/apikey