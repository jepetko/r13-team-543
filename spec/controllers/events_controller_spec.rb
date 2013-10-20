require 'spec_helper'

describe EventsController do

  render_views

  before(:each) do
    @lonlat = { :lon => 16.37, :lat => 48.208202}
  end

  describe 'routing' do
    it 'routes to #index' do
      { :get => '/events'}.should \
          route_to(:controller => 'events', :action => 'index')
    end
  end

  describe 'GET /index' do

    before(:each) do
      request.env['HTTP_ACCEPT'] = 'application/json'
    end

    it 'is failure if parameters are missing' do
      expect {
        get :index
      }.to raise_error
    end

    it 'is success if spatial parameters are passed' do
      get :index, @lonlat.merge(format: 'geojson')
      response.should be_success
      b = response.body
      b.should =~ /^\{/
      b.should =~ /\}$/

      json = ActiveSupport::JSON.decode(response.body)
      json['type'].should eq('FeatureCollection')
      json['features'].is_a?(Array).should be_true
    end

  end



end
