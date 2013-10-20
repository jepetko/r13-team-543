Railsrumble::Application.routes.draw do

  resources :events, :only => [:index]

  match '/locations/find' => 'locations#find', :via => :get

  root to: 'home#index'

end