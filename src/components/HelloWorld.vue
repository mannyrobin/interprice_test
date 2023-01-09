<template>
  <v-container>
    <v-row>
      <v-col sm="12">
        <v-btn-toggle v-model="activeCurrency" mandatory class="action-btn-group">
          <v-btn v-for="currency in allCurrencies" :key="`${currency}_currency`" :value="currency">
            {{ currency }}
          </v-btn>
        </v-btn-toggle>
        <v-btn-toggle v-model="activeYears" multiple class="action-btn-group">
          <v-btn v-for="years in allYears" :key="`${years}_years`" :value="years">
            {{ years }} {{ years === 1 ? "YR" : "YRS"}}
          </v-btn>
        </v-btn-toggle>
        <v-btn-toggle v-model="activeDisplay" mandatory class="action-btn-group">
          <v-btn v-for="(display, index) in allDisplays" :key="`${display}_display`" :value="display" class="display-option">
            {{ displayOptionTitle[index] }}
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
    <v-row>
      <v-col sm="3">
        <v-text-field
          outlined
          v-model="searchKey"
          placeholder="Filter by company name ..."
        />
      </v-col>
    </v-row>
    <v-row>
      <v-simple-table class="quote-table">
        <template v-slot:default>
          <thead>
            <tr>
              <th rowspan="2" v-on:click="setSortBy('dateSent')">
                Date Sent
                <span v-if="sortBy === 'dateSent'">
                  {{ sortDir === "asc" ? "&#9650;" : "&#9660;"}}
                </span>
              </th>
              <th rowspan="2" v-on:click="setSortBy('company')">
                Comapny
                <span v-if="sortBy === 'company'">
                  {{ sortDir === "asc" ? "&#9650;" : "&#9660;"}}
                </span>
              </th>
              <th v-for="years in sortedActiveYears" :key="`${years}_years_table`" :value="years" colspan="2">
                {{ years }} {{ years === 1 ? "YR" : "YRS"}}
              </th>
            </tr>
            <tr>
              <fragment v-for="years in sortedActiveYears" :key="`${years}_years_table`" :value="years" colspan="2">
                <th>FIX</th>
                <th>FRN</th>
              </fragment>
            </tr>
          </thead>
          <tbody>
            <fragment v-for="(companyInfo, index) in items" :key="companyInfo.id">
              <tr :class="{ 'empty-row': companyInfo.quote.length == 0 }">
                <td>
                  <v-icon v-on:click="expandItem(index)" v-if="companyInfo.quote.length > 0">
                    {{ companyInfo.expanded ? "mdi-chevron-down" : "mdi-chevron-right" }}
                  </v-icon>
                  {{formatDate(companyInfo.dateSent)}}
                </td>
                <td>{{companyInfo.company}}</td>
                <fragment v-for="years in sortedActiveYears" :key="`${years}_years_table_cell_${companyInfo.id}`">
                  <td :class="{
                    'minvalue-cell': formatedData['items'][companyInfo.company][activeDisplay]['FIX'][years] === formatedData['min']['FIX'][years]
                  }">
                    {{ formatAmount(activeDisplay, formatedData["items"][companyInfo.company][activeDisplay]["FIX"][years]) }}
                  </td>
                  <td :class="{
                    'minvalue-cell': formatedData['items'][companyInfo.company][activeDisplay]['FRN'][years] === formatedData['min']['FRN'][years]
                  }">
                    {{ formatAmount(activeDisplay, formatedData["items"][companyInfo.company][activeDisplay]["FRN"][years]) }}
                  </td>
                </fragment>
              </tr>
              <fragment v-if="companyInfo.expanded">
                <fragment v-for="(display, displayIndex) in allDisplays" :key="display">
                  <tr v-if="display !== activeDisplay">
                    <td></td>
                    <td>{{displayOptionTitle[displayIndex]}}</td>
                    <fragment v-for="years in sortedActiveYears" :key="`${years}_years_table_cell_${companyInfo.id}`">
                      <td>{{ formatAmount(display, formatedData["items"][companyInfo.company][display]["FIX"][years]) }}</td>
                      <td>{{ formatAmount(display, formatedData["items"][companyInfo.company][display]["FRN"][years]) }}</td>
                    </fragment>
                  </tr>
                </fragment>
              </fragment>
            </fragment>
            <tr class="average-row">
              <td></td>
              <td>Average by {{ getActiveDisplay() }}</td>
              <fragment v-for="years in sortedActiveYears" :key="years">
                <td>{{ formatAmount(activeDisplay, formatedData["average"]["FIX"][years]) }}</td>
                <td>{{ formatAmount(activeDisplay, formatedData["average"]["FRN"][years]) }}</td>
              </fragment>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-row>
  </v-container>
</template>

<script>
import { getAllCurrencies, getQuotesInfo } from '@/services/quotes'
import moment from 'moment';

export default {
  name: 'HelloWorld',

  data() {
    return {
      items: [],
      allYears: [],
      allCurrencies: [],
      activeCurrency: "",
      activeYears: [],
      allDisplays: ["spread", "yield", "3MlSpread"],
      displayOptionTitle: ["Spread", "Yield", "3MLSpread"],
      activeDisplay: "spread",
      searchKey: "",
      sortBy: "dateSent",
      sortDir: "desc",
    };
  },

  methods: {
    getActiveDisplay() {
      const index = this.allDisplays.indexOf(this.activeDisplay);
      return this.displayOptionTitle[index];
    },
    formatAmount(displayOption, amount) {
      if (!amount) return "";
      if (this.allDisplays.indexOf(displayOption) === -1) return "";

      const suffix = displayOption === "yield" ? "%" : "bp";
      const prefix = amount > 0 ? "+" : "";
      return `${prefix}${Math.floor(amount * 100) / 100}${suffix}`;
    },
    formatDate(date) {
      return date ? moment(date).format("DD-MMM-YY") : "";
    },
    setSortBy(newSortBy) {
      if (this.sortBy === newSortBy) {
        this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
      } else {
        this.sortBy = newSortBy
      }
    },
    expandItem(index) {
      this.items[index].expanded = !this.items[index].expanded;
    }
  },

  created() {
    this.allCurrencies = getAllCurrencies();
    this.items = getQuotesInfo(this.activeCurrency, this.searchKey, this.sortBy, this.sortDir);
  },

  computed: {
    formatedData() {
      let dataByYears = {
        "FIX": {},
        "FRN": {},
      };

      let displayData = {
        items: {},
        average: {
          "FIX": {},
          "FRN": {},
        },
        min: {
          "FIX": {},
          "FRN": {},
        },
      };

      this.allYears.forEach((years) => {
        dataByYears["FIX"][years] = [];
        dataByYears["FRN"][years] = [];
      });

      this.items.forEach(({company}) => {
        displayData["items"][company] = {
          "spread": {
            "FIX": {},
            "FRN": {},
          },
          "yield": {
            "FIX": {},
            "FRN": {},
          },
          "3MlSpread": {
            "FIX": {},
            "FRN": {},
          },
        };
      });

      this.items.forEach(({company, quote}) => {
        quote.forEach((quoteItem) => {
          displayData["items"][company]["spread"][quoteItem["couponType"]][quoteItem["years"]] = quoteItem["spread"];
          displayData["items"][company]["yield"][quoteItem["couponType"]][quoteItem["years"]] = quoteItem["yield"];
          displayData["items"][company]["3MlSpread"][quoteItem["couponType"]][quoteItem["years"]] = quoteItem["3MlSpread"];
          if (quoteItem[this.activeDisplay]) {
            dataByYears[quoteItem["couponType"]][quoteItem["years"]].push(quoteItem[this.activeDisplay]);
          }
        })
      });

      this.allYears.forEach((years) => {
        const fixItems = dataByYears["FIX"][years];
        const frnItems = dataByYears["FRN"][years];
        const fixSum = fixItems.reduce((acc, val) => (acc + val), 0);
        const frnSum = frnItems.reduce((acc, val) => (acc + val), 0);
        displayData["average"]["FIX"][years] = fixItems.length > 0 ? (fixSum / fixItems.length) : 0;
        displayData["average"]["FRN"][years] = frnItems.length > 0 ? (frnSum / frnItems.length) : 0;

        displayData["min"]["FIX"][years] = Math.min(...fixItems);
        displayData["min"]["FRN"][years] = Math.min(...frnItems);
      });

      console.log(dataByYears);

      return displayData;
    },
    sortedActiveYears() {
      let tempActiveYears = [...this.activeYears];
      tempActiveYears.sort((a, b) => (a - b));
      return tempActiveYears;
    },
    filterAndSortFlags(){
      return `${this.activeCurrency}|${this.sortBy}|${this.sortDir}|${this.searchKey}`;
    }
  },

  watch: {
    allCurrencies(newCurrencies) {
      let initialIndex = newCurrencies.indexOf("USD");
      if (initialIndex === -1) {
        initialIndex = 0;
      }
      this.activeCurrency = initialIndex;
    },
    items(newItems) {
      const years = new Set();
      newItems.forEach(({quote}) => {
        quote.forEach((quoteItem) => {
          years.add(quoteItem.years);
        });
      });

      this.allYears = Array.from(years);
      this.activeYears = [...this.allYears].sort();
    },
    filterAndSortFlags(newFilterAndSortFlags) {
      const [newActiveCurrency, newSortBy, newSortDir, newSearchKey] = newFilterAndSortFlags.split("|");

      this.items = getQuotesInfo(newActiveCurrency, newSearchKey, newSortBy, newSortDir);
    },
  },
}
</script>

<style scoped>
.empty-row {
  color: gray;
}
.average-row {
  border: 1px solid black;
}
.action-btn-group {
  margin-right: 35px;
}
table th {
  text-align: center !important;
}
.display-option {
  text-transform: capitalize;
}
.minvalue-cell {
  background: lightgray;
}
</style>