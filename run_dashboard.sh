cask "r-corex-holo5d" do
  version "1.0"
  sha256 :no_check

  url "https://rounsavilletechnologies.com/Downloads/RCOREX_Holo5D.pkg"
  name "R-COREX Holo5D"
  desc "Quantum holographic overlay system by Joseph Michael Rounsaville"
  homepage "https://rounsavilletechnologies.com"

  pkg "RCOREX_Holo5D.pkg"

  uninstall pkgutil: "com.rounsaville.holo5d"
end