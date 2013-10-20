require_relative '../../app/controllers/grabber/meetup_grabber'
require 'spec_helper'

describe MeetupGrabber::Client do

  before(:each) do

    @lonlat = { :lon => 16.37, :lat => 48.208202}

    MeetupGrabber::Client.setup do |config|
      config.url = 'https://api.meetup.com'
      config.version = '2'
      config.api_key = '591b4a3573651e4125597179735e6850'
    end
  end

  describe 'some basic configuration' do

    before(:all) do
      @clazz = MeetupGrabber::Client
    end

    it 'should have couple of methods' do
      [:setup, :url, :api_key, :version].each do |method|
        @clazz.respond_to?(method).should be_true
      end
    end

    it 'should be able to generate the proper url' do
      @clazz.generate_url(:open_events).should eq('https://api.meetup.com/2/open_events.json')
    end

    it 'should be able to provide proper parameters' do
      params = @clazz.generate_params @lonlat
      params.should have_key(:key)
      params.should have_key(:lon)
      params.should have_key(:lat)
    end

  end

  describe 'grabbing open_events' do

    before(:each) do
      @grabber = MeetupGrabber::Client.new
    end

    it 'should be able to grab some events if we pass lon/lat parameters' do
      response = @grabber.grab_rough_data @lonlat
      response.body.should =~ /^\{(.*)\}$/
    end

    it 'should return geojson compatible hash' do
      hash = @grabber.grab @lonlat
      hash.should be_a(Hash)
      hash.should have_key('results')
      results = hash['results']
      results.should be_a(Array)
    end

  end

end

