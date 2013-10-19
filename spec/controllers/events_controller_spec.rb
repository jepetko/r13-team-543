require 'spec_helper'

describe EventsController do

  render_views

  before(:each) do
    @lonlat = { :lon => '', :lat => ''}
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
      get :index
      response.body.should have_content('You must submit :lon and :lat!')
    end

    it 'is success if spatial parameters are passed' do
      get :index, @lonlat
      b = response.body
      b.should =~ /^\{/
      b.should =~ /\}$/
    end

  end



end
