import data from './data.json';
import camelcaseKeys from 'camelcase-keys';

export function getQuotesInfo(activeCurrency = "", searchKey = "", sortBy = "dateSent", sortDir = "") {
    const parsedData = camelcaseKeys(data, {
        deep: true,
    });
    let { items } = parsedData;
    const filterKey = searchKey.toLowerCase();

    items = items.filter(({company}) => (company.toLowerCase().indexOf(filterKey) !== -1));
    items = items.sort((itemA, itemB) => {
        if (!itemA.quote) return 1;
        if (!itemB.quote) return -1;
        if (sortBy) {
            if (itemA[sortBy] > itemB[sortBy]) return sortDir === "asc" ? 1 : -1;
            if (itemA[sortBy] < itemB[sortBy]) return sortDir === "asc" ? -1 : 1;
            return 0;
        }
        return itemA["preferred"] - itemB["preferred"];
    });

    let result = items.map((item) => {
        let newQuotes;
        if (!item.quote) {
            newQuotes = [];
        } else {
            newQuotes = item.quote.filter(({currency}) => (!activeCurrency || currency === activeCurrency));
        }
        return {
            ...item,
            quote: newQuotes,
            expanded: false,
        };
    });

    return result;
}

export function getAllCurrencies() {
    const items = getQuotesInfo();
    const currencies = new Set();
    items.forEach(({quote}) => {
        if (!quote) return;
        quote.forEach((quoteItem) => {
            currencies.add(quoteItem.currency);
        });
    });
    return Array.from(currencies);
}