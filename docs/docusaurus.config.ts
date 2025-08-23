import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'DelReact',
  tagline: 'Agent-based task planning framework built on LangChain LangGraph',
  favicon: 'img/favicon.ico',
  

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: process.env.NODE_ENV === 'development' ? 'http://localhost:3000/' : 'https://delegasi-tech.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: process.env.NODE_ENV === 'development' ? '/' : '/delreact-agent/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Delegasi-Tech', // Usually your GitHub org/user name.
  projectName: 'delreact-agent', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',


  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/Delegasi-Tech/DelReact/tree/main/docs/contents',
          routeBasePath: '/', // Serve docs at root
          path: 'contents',
          id: 'default',
          includeCurrentVersion: true,
          sidebarCollapsed: false,
        },
        blog: false,
        pages: false, // Disable the pages plugin to remove homepage
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/delreact-social-card.png',
    navbar: {
      title: 'DelReact',
      logo: {
        alt: 'DelReact Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/ReactAgentBuilder-Quick-Reference',
          position: 'left',
          label: 'Reference',
        },
        {
          href: 'https://github.com/Delegasi-Tech/delreact-agent/tree/main/example',
          position: 'left',
          label: 'Code Examples',
        },
        {
          href: 'https://github.com/Delegasi-Tech/DelReact-Agent',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/',
            },
            {
              label: 'Quick Reference',
              to: '/ReactAgentBuilder-Guide',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Issues',
              href: 'https://github.com/Delegasi-Tech/DelReact-Agent/issues',
            },
            {
              label: 'GitHub Repo',
              href: 'https://github.com/Delegasi-Tech/DelReact-Agent',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'NPM Package',
              href: 'https://www.npmjs.com/package/delreact-agent',
            },
            {
              label: 'NOTICE',
              href: 'https://raw.githubusercontent.com/Delegasi-Tech/delreact-agent/refs/heads/main/NOTICE',
            }
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Delegasi Tech. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
