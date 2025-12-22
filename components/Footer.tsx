import { Github } from 'lucide-react'
import { useTranslation } from 'next-i18next'

export function Footer() {
  const { t } = useTranslation('common')
  
  return (
    <footer className="w-full border-t border-primary-light/20 mt-auto py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-primary-gray text-sm">
            {t('footer.madeWith')} <span className="text-pink-500">❤️</span> {t('footer.by')}{' '}
            <span className="text-white font-semibold">0xfannie.eth</span>
          </p>
          <p className="text-primary-gray text-xs">
            {t('footer.description')}
          </p>
        </div>
        <a
          href="https://github.com/0xFannie/multisig-deployer"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-dark border border-primary-light/30 hover:border-primary-light/50 hover:bg-primary-light/10 transition-all group"
          aria-label="GitHub Repository"
        >
          <Github className="w-5 h-5 text-primary-gray group-hover:text-primary-light transition-colors" />
        </a>
      </div>
    </footer>
  )
}

