<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import SplitFlapEventsList from '@/components/SplitFlapEventsList.vue'
import EventsList from '@/components/EventsList.vue'
import { type CalendarEvent, parseGoogleCalendarIcs } from '@/lib/googleCalendar'

defineOptions({ name: 'UpcomingEvents' })

const eventData = ref<CalendarEvent[]>([])
const showPastEvents = ref(false)
const showBoardView = ref(window.innerWidth >= 960)
const now = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | undefined

const isPastEvent = (event: CalendarEvent) => {
  const cutoff = event.endsAt ?? event.startsAt
  return Date.parse(cutoff) < now.value
}

const upcomingEvents = computed(() => eventData.value.filter((event) => !isPastEvent(event)))
const pastEvents = computed(() => eventData.value.filter(isPastEvent).slice().reverse())
const visibleEvents = computed(() =>
  showPastEvents.value ? pastEvents.value : upcomingEvents.value,
)
const pageTitle = computed(() => (showPastEvents.value ? 'Past Events' : 'Upcoming Events'))
const calendarFeedUrl = '/calendar-ics'

const loadCalendarEvents = async () => {
  const response = await fetch(calendarFeedUrl)
  const ics = await response.text()
  eventData.value = parseGoogleCalendarIcs(ics)
}

onMounted(() => {
  void loadCalendarEvents()
  nowTimer = setInterval(() => {
    now.value = Date.now()
  }, 60_000)
})

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
})

defineExpose({
  eventData,
  upcomingEvents,
  pastEvents,
  visibleEvents,
  showPastEvents,
  now,
})
</script>

<template>
  <v-container class="pa-4 pa-sm-8 bg-background" fluid>
    <v-row no-gutters>
      <v-col class="bg-surface pa-4 rounded-t-lg" cols="12">
        <v-card class="w-100 bg-surface" flat>
          <v-card-item>
            <v-card-title class="text-h4 font-weight-black text-primary text-wrap pl-0">
              {{ pageTitle }}
            </v-card-title>
            <v-card-subtitle
              class="pa-0 mt-2 text-body-2 text-medium-emphasis d-flex align-center flex-wrap"
              style="column-gap: 2rem; row-gap: 0.5rem"
            >
              <button
                class="view-toggle-btn event-control d-inline-flex align-center"
                type="button"
                :aria-pressed="showBoardView"
                @click="showBoardView = !showBoardView"
              >
                <v-icon
                  class="me-1"
                  :icon="showBoardView ? 'mdi-format-list-bulleted' : 'mdi-view-dashboard'"
                  size="16"
                ></v-icon>
                <span>{{ showBoardView ? 'Simple view' : 'Ticket Board View' }}</span>
              </button>
              <a
                class="event-control d-inline-flex align-center"
                :href="calendarFeedUrl"
                rel="noopener noreferrer"
                target="_blank"
              >
                <v-icon class="me-1" icon="mdi-calendar" size="16"></v-icon>
                <span>Subscribe to this calendar</span>
              </a>
              <button
                class="past-toggle-btn event-control d-inline-flex align-center"
                type="button"
                @click="showPastEvents = !showPastEvents"
              >
                <v-icon
                  class="me-1"
                  :icon="showPastEvents ? 'mdi-calendar-arrow-right' : 'mdi-history'"
                  size="16"
                ></v-icon>
                <span>{{ showPastEvents ? 'View upcoming events' : 'View past events' }}</span>
              </button>
            </v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>
      <SplitFlapEventsList
        v-if="showBoardView"
        :events="visibleEvents"
        :show-past-events="showPastEvents"
        :now="now"
      />
      <EventsList v-else :events="visibleEvents" :show-past-events="showPastEvents" />
    </v-row>
  </v-container>
</template>

<style scoped>
.event-control {
  color: inherit;
  padding: 3px;
  border-radius: 4px;
  text-decoration: none;
  text-underline-offset: 0.18em;
}

.event-control span {
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.past-toggle-btn,
.view-toggle-btn {
  background: none;
  border: none;
  font: inherit;
  cursor: pointer;
}

@media (hover: hover) {
  .event-control:hover {
    background-color: hsla(160, 100%, 37%, 0.2);
  }
}
</style>
