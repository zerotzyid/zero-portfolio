# ZeroTzy.ID Portfolio

## Overview

ZeroTzy.ID is a production-ready portfolio website built with TanStack Start, showcasing the work and profile of Zero (Developer/Builder/Creative Technologist).

## Features

- **TanStack Start** - TypeScript-powered routing and data loading
- **React** - Component-based UI with hooks
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **Docker** - Containerized deployment
- **Performance optimized** - Fast initial render, minimal JavaScript
- **Accessibility** - Semantic HTML, keyboard navigation
- **SEO optimized** - Proper metadata and structure

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
# Visit: http://localhost:3474
```

### Production Build

```bash
npm run build
```

### Docker Deployment

```bash
docker compose up -d --build
```

## Project Structure

```
zero-portfolio/
├── src/
│   ├── routes/
│   ├── components/
│   ├── pages/
│   ├── data/
│   ├── styles/
│   └── router.ts
├── public/
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Color System

### Light Theme

- **Background**: Warm white (#fefefe)
- **Foreground**: Near-black (#0a0a0a)
- **Neutral Gray**: #6b7280
- **Accent**: Muted dark red (#8b0000)

### Dark Mode

- **Background**: Near-black (#0a0a0a)
- **Foreground**: Warm white (#fefefe)
- **Neutral Gray**: #9ca3af
- **Accent**: Soft red (#b91c1c)

## Design Principles

- **Minimal Editorial**: Clean, purposeful design
- **Modern Developer**: Technical precision with warmth
- **Independent**: Self-built, not template-based
- **Technical Publication**: Content-first, form follows function

## Development

This project uses **TanStack Start** for routing and data loading, providing:

- File-system based routing
- Type-safe routing
- Built-in code splitting
- Server-side rendering capabilities
- Excellent developer experience

## Production

Built with production in mind:

- **Fast initial render** with TanStack Start
- **Optimized bundle size**
- **Component-first architecture**
- **Performance monitoring**
- **Accessibility compliance**

## Technology Stack

- **Framework**: TanStack Start
- **Language**: TypeScript
- **UI Library**: React
- **Styling**: Tailwind CSS
- **Build Tool**: Vite (via TanStack Start)
- **Deployment**: Docker
- **State Management**: TanStack Query (via TanStack Start)

## Features

### Home
- Hero section with name and role
- Brief introduction
- Call-to-action buttons

### Work
- Portfolio projects showcase
- Project filtering and details
- Technology stack display

### About
- Personal background
- Skills and expertise
- Professional journey

### Experiments
- Side projects and experiments
- Technical exploration
- Learning projects

### Contact
- Contact information
- Social media links
- Email communication

## Quality Control

### Performance
- Optimized bundle size
- Fast initial render
- Lazy loading
- Image optimization

### Accessibility
- Semantic HTML
- Keyboard navigation
- Screen reader support
- Color contrast compliance

### Code Quality
- TypeScript type checking
- ESLint with Prettier
- Consistent code style

## Development Workflow

1. **Feature Development**
   - Create new pages in `src/pages/`
   - Update routing in `src/router.ts`
   - Add components in `src/components/`
   - Update data in `src/data/`

2. **Testing**
   - Type checking with `npm run type-check`
   - Linting with `npm run lint`
   - Production build with `npm run build`

3. **Deployment**
   - Build Docker image
   - Run production server
   - Verify functionality

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Check TypeScript errors
npm run type-check

# Check linting issues
npm run lint
```

#### Docker Issues
```bash
# Rebuild image
docker compose build

# Clear cache
docker compose down -v
```

### Performance Issues

#### Slow Initial Load
- Check bundle size in production build
- Verify image optimization
- Check for unused dependencies

#### Mobile Layout Issues
- Test on different screen sizes
- Verify responsive breakpoints
- Check touch targets

## Contributing

1. Fork the repository
2. Create your feature branch
3. Follow code style guidelines
4. Add tests for new features
5. Submit a pull request

## License

MIT