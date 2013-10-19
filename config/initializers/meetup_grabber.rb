require_relative '../../app/controllers/grabber/meetup_grabber'

MeetupGrabber::Client.setup do |config|
  config.url = 'https://api.meetup.com'
  config.version = '2'
  config.api_key = '591b4a3573651e4125597179735e6850'
end