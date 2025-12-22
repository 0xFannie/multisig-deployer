import { useRouter } from 'next/router'
import { Globe } from 'lucide-react'
import { useState, useEffect } from 'react'

export function LanguageSwitcher() {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false)
    if (showMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale, shallow: false })
    setShowMenu(false)
  }

  if (!mounted) return null

  const currentLocale = router.locale || 'zh-CN'
  const languages = [
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ]

  const currentLang = languages.find(lang => lang.code === currentLocale) || languages[0]

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowMenu(!showMenu)
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-gray/20 border border-primary-gray/30 hover:border-primary-light/50 transition-all group"
      >
        <Globe className="w-4 h-4 text-primary-gray group-hover:text-primary-light transition-colors" />
        <span className="text-white font-medium text-sm">{currentLang.flag} {currentLang.name}</span>
      </button>

      {showMenu && (
        <div className="absolute top-full mt-2 right-0 w-48 glass-card rounded-xl p-2 shadow-2xl border border-primary-light/20 z-[9999]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                currentLocale === lang.code
                  ? 'bg-primary-light/20 border border-primary-light/30'
                  : 'hover:bg-primary-gray/20'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-white text-sm font-medium flex-1 text-left">{lang.name}</span>
              {currentLocale === lang.code && (
                <span className="text-primary-light text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

