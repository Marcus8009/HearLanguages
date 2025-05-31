import requests
import pandas as pd

# 1. List of countries (as before)
countries = [
    "India", "China", "United States", "Indonesia", "Pakistan", "Nigeria",
    "Brazil", "Bangladesh", "Ethiopia", "Mexico", "Russia", "Philippines",
    "Democratic Republic of the Congo", "Egypt", "Japan", "Vietnam", "Iran",
    "Turkey", "Tanzania", "Germany", "Kenya", "France", "Thailand",
    "United Kingdom", "Uganda", "Myanmar", "South Africa", "Italy", "Iraq",
    "Colombia", "Spain", "Argentina", "Afghanistan", "Algeria", "Sudan",
    "South Korea", "Morocco", "Mozambique", "Nepal", "Ukraine", "Ghana",
    "Canada", "Cameroon", "Malaysia", "Yemen", "Madagascar", "Venezuela",
    "Poland", "Saudi Arabia", "Peru", "Malawi", "Uzbekistan", "Burkina Faso",
    "Angola", "Niger", "Ivory Coast", "Mali", "Syria", "North Korea",
    "Australia", "Zambia", "Sri Lanka", "Taiwan", "Senegal", "Kazakhstan",
    "South Sudan", "Zimbabwe", "Rwanda", "Burundi", "Guatemala", "Cambodia",
    "Romania", "Ecuador", "Chile", "Guinea", "Netherlands", "Benin",
    "Somalia", "Chad", "Bolivia", "Dominican Republic", "Belgium", "Haiti",
    "Togo", "Tunisia", "Honduras", "Sweden", "Azerbaijan", "Tajikistan",
    "Portugal", "Israel", "Czech Republic", "Greece", "Cuba", "Jordan",
    "Sierra Leone", "Eritrea", "Hungary", "Austria", "Switzerland",
    "Belarus", "Laos", "Papua New Guinea", "Paraguay", "Libya",
    "Central African Republic", "United Arab Emirates", "Singapore",
    "Republic of the Congo", "Hong Kong", "Nicaragua", "Kyrgyzstan",
    "Palestine", "Serbia", "Liberia", "El Salvador", "Bulgaria",
    "Turkmenistan", "Norway", "Ireland", "Costa Rica", "Denmark", "Lebanon",
    "Finland", "Mauritania", "Slovakia", "New Zealand", "Georgia", "Oman",
    "Panama", "Croatia", "Bosnia and Herzegovina", "Mongolia", "Uruguay",
    "Kuwait", "Jamaica", "Puerto Rico", "Albania", "Armenia", "Moldova",
    "Gambia", "Botswana", "Qatar", "Gabon", "Guinea-Bissau", "Namibia",
    "Lithuania", "Kosovo", "North Macedonia", "Lesotho", "Timor-Leste",
    "Slovenia", "Eswatini", "Bahrain", "Latvia", "Mauritius", "Cyprus",
    "Djibouti", "Equatorial Guinea", "Trinidad and Tobago", "Estonia",
    "Comoros", "Fiji", "Western Sahara", "Bhutan", "Solomon Islands", "Guyana",
    "Luxembourg", "Suriname", "Cape Verde", "Macau", "Montenegro", "Brunei",
    "Belize", "Malta", "Maldives", "Iceland", "Vanuatu", "Bahamas",
    "New Caledonia", "French Polynesia", "Barbados", "São Tomé and Príncipe",
    "Samoa", "Guam", "Saint Lucia", "Curaçao", "Aruba", "Kiribati", "Grenada",
    "Antigua and Barbuda", "Jersey", "Seychelles", "Tonga",
    "Saint Vincent and the Grenadines", "Isle of Man", "Marshall Islands",
    "Federated States of Micronesia", "United States Virgin Islands", "Andorra"
]

# 2. Query REST Countries and build mapping with Top-2 languages
mapping = []
for country in countries:
    try:
        resp = requests.get(f"https://restcountries.com/v3.1/name/{country}", timeout=5)
        data = resp.json()[0]
        langs = list(data.get("languages", {}).values())
        # take first two if available
        primary   = langs[0] if len(langs) > 0 else "N/A"
        secondary = langs[1] if len(langs) > 1 else "N/A"
    except Exception:
        primary, secondary = "N/A", "N/A"
    mapping.append({
        "Country": country,
        "PrimaryLanguage":   primary,
        "SecondaryLanguage": secondary
    })

# 3. DataFrame
df = pd.DataFrame(mapping)

# 4. Show the first 15 rows
print(df.head(150).to_markdown(index=False))
