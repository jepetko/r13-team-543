module MeetupGrabber

  module BasicSupport

    def self.included(base)
      base.extend ClassMethods
    end

    module ClassMethods

      attr_accessor :url
      attr_accessor :version
      attr_accessor :api_key

      def setup
        yield self
      end

      def entity_supported?(entity)
        [:open_events].include?(entity)
      end

      def generate_url(entity)
        return null if !entity_supported?(entity)
        "#{url}/#{version}/#{entity}.json"
      end

      def generate_params(params = {})
        uri_params = params.reject { |k,v| %w{action controller format}.include?(k) }
        uri_params[:key] = api_key
        uri_params
      end
    end

  end

  class Client

    include BasicSupport

    def grab_rough_data(params)
      url = Client.generate_url(:open_events)
      uri_params = Client.generate_params(params)

      ##note: to prevent the utf-8 byte sequence issue we must set the proper charset in headers
      RestClient.get url, {params: uri_params, 'Accept-Charset' => 'utf-8'}
    end

    def grab(params)
      response = grab_rough_data params
      hash = ActiveSupport::JSON.decode(response.body)
      hash
    end
  end
end